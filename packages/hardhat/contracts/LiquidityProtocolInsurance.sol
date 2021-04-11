// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.7/interfaces/AggregatorV3Interface.sol";

import "./interfaces/liquidityProtocol/ILiquidityProtocol.sol";
import "./InsuranceContract.sol";

contract LiquidityProtocolInsurance is Ownable{

    using SafeMath for uint256;

    struct LiquidityAssetPair{
        address liquidityProtocol;
        uint256 latestReserve;
    }

    event InsurancePolicyCreation (
        address indexed beneficiary,
        address indexed insuranceContractAddress
    );
    
    event Payout (
        address indexed beneficiary,
        address indexed insuranceContractAddress,
        uint256 amountPaid
    );

    AggregatorV3Interface internal tusdReserveFeed;
    AggregatorV3Interface internal tusdSupplyFeed;

    address public tusdTokenAddress; 
    uint256 constant public MAXIMUM_RESERVE_DECREASE_PERCENTAGE = 75;

    address[] public liquidityProtocolImplementations;
    address[] public insuranceContracts;
    LiquidityAssetPair[] public liquidityAssetPairs;
    
    mapping(address => address[]) public insuranceContractOwnerships;
    mapping(uint => address[]) public liquidityAssetPairToInsuranceContracts;

    constructor(address[] memory _liquidityProtocolImplementations, 
                address _tusdTokenAddress,
                address _tusdSupplyFeedAddress, 
                address _tusdReserveFeedAddress) {
        liquidityProtocolImplementations = _liquidityProtocolImplementations;
        tusdTokenAddress = _tusdTokenAddress;
        tusdReserveFeed = AggregatorV3Interface(_tusdReserveFeedAddress);
        tusdSupplyFeed = AggregatorV3Interface(_tusdSupplyFeedAddress);
    }

    modifier validateLiquidityProtocolAddress(address _liquidityProtocolAddress) {
        bool found = false;
        for(uint i = 0; i < liquidityProtocolImplementations.length; i++){
            if(_liquidityProtocolAddress == liquidityProtocolImplementations[i]){
                found = true;
            }
        }
        require(found, "Liquidity Protocol address not found in the whitelist");
        _;
    }

    function registerInsurancePolicy(
        uint256 _amountInsured,
        address _liquidityProtocol) 
    public validateLiquidityProtocolAddress(_liquidityProtocol) {
        //Create insurance contract
        InsuranceContract insuranceContract = new InsuranceContract(
                _amountInsured,
                _liquidityProtocol,
                msg.sender, 
                tusdTokenAddress,
                address(this));
        
        ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(_liquidityProtocol);

        //Send tokens to liquidity protocol interface contract
        IERC20 asset = IERC20(tusdTokenAddress);
        asset.transferFrom(msg.sender, _liquidityProtocol, _amountInsured);
        
        //Put tokens in liquidity pool
        liquidityProtocol.lockTokens(tusdTokenAddress, _amountInsured);
        
        //Update latest reserve value
        uint256 reserve = liquidityProtocol.getReserve(tusdTokenAddress);
    
        LiquidityAssetPair memory pair = LiquidityAssetPair({ liquidityProtocol: _liquidityProtocol, latestReserve: reserve});
        uint liquidityAssetPairIdentifier = registerLiquidityAssetPair(pair);

        //Send liquidity tokens to the Insurance Contract - 10% which will remain in this contract
        IERC20 reserveAsset = IERC20(liquidityProtocol.getReserveTokenAddress(tusdTokenAddress));
        uint256 amountToKeep = (_amountInsured * 10) / 100;        
        reserveAsset.transfer(address(insuranceContract), _amountInsured - amountToKeep);
        
        
        //Register address of Insurance Contract on chain
        address insuranceContractAddress = address(insuranceContract);

        insuranceContracts.push(insuranceContractAddress);
        insuranceContractOwnerships[msg.sender].push(insuranceContractAddress);
        liquidityAssetPairToInsuranceContracts[liquidityAssetPairIdentifier].push(insuranceContractAddress);

        emit InsurancePolicyCreation(msg.sender, insuranceContractAddress);
    }

    function getInsurancePolicyAddresses() public view returns(address[] memory) {
        return insuranceContractOwnerships[msg.sender];
    }

    function getTUSDSupplyFeed() external view returns(address) {
        return address(tusdSupplyFeed);
    }

    function getTUSDReserveFeed() external view returns(address) {
        return address(tusdReserveFeed);
    }

    // ADMIN FUNCTIONS
    function setTUSDSupplyFeed(address _tusdSupplyFeedAddress) external onlyOwner {
        tusdSupplyFeed = AggregatorV3Interface(_tusdSupplyFeedAddress);
    }

    function setTUSDReserveFeed(address _tusdReserveFeedAddress) external onlyOwner {
        tusdReserveFeed = AggregatorV3Interface(_tusdReserveFeedAddress);
    }

    function checkStatusForUnstableTUSDPeg() public view returns (bool) {
        bool shouldMakeTransaction = false;
        int supply; 
        int reserve;
        int percentage = 0;
        ( , supply, , , ) = tusdSupplyFeed.latestRoundData();
        ( , reserve, , , ) = tusdReserveFeed.latestRoundData();
        if(reserve < supply) { 
            int difference = supply  - reserve;
            percentage = (difference * 100) / supply;
            if(percentage > 5){
                shouldMakeTransaction = true;
            }
        }
        return shouldMakeTransaction;
    }

    function withdraw(address _insuranceContractAddress) external {
        InsuranceContract insuranceContract = InsuranceContract(_insuranceContractAddress);
        require(msg.sender == insuranceContract.beneficiary(), "only a beneficiary can trigger a withdrawal");
        insuranceContract.withdraw();
    }

    // CALLED EXTERNALLY    
    function checkForSignificantReserveDecreaseAndPay() public onlyOwner {
        for(uint liquidityAssetPairsIdx = 0; liquidityAssetPairsIdx < liquidityAssetPairs.length; liquidityAssetPairsIdx++){
            LiquidityAssetPair storage pair = liquidityAssetPairs[liquidityAssetPairsIdx];
            uint256 decreasePercentage = calculateReserveDecreasePercentage(pair);
            if(decreasePercentage >= MAXIMUM_RESERVE_DECREASE_PERCENTAGE){
                ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(pair.liquidityProtocol);
                address reserveTokenAddress  = liquidityProtocol.getReserveTokenAddress(tusdTokenAddress);
                IERC20 reserveToken = IERC20(reserveTokenAddress);
                reserveToken.transfer(pair.liquidityProtocol, reserveToken.balanceOf(address(this)));
                liquidityProtocol.unlockTokens(tusdTokenAddress, reserveToken.balanceOf(address(this)));
                for(uint256 insuranceContractsIdx = 0; insuranceContractsIdx < liquidityAssetPairToInsuranceContracts[liquidityAssetPairsIdx].length; insuranceContractsIdx++){
                    address insuranceContractAddress = liquidityAssetPairToInsuranceContracts[liquidityAssetPairsIdx][insuranceContractsIdx];
                    payInsuranceContract(insuranceContractAddress);
                }
            }
        }
    }

    function checkForUnstableTUSDPegAndPay() external onlyOwner {                       
        int supply; 
        int reserve;
        int percentage = 0;
        ( , supply, , , ) = tusdSupplyFeed.latestRoundData();
        ( , reserve, , , ) = tusdReserveFeed.latestRoundData();
        if(reserve < supply) { 
            int difference = supply  - reserve;
            percentage = (difference * 100) / supply;
            if(percentage > 5){
                //Question: Should we pay in a different currency? (WETH, DAI)
                payAllInsuranceContracts();
            }
        }
    }


    // PRIVATE FUNCTIONS
    function payAllInsuranceContracts() private {
        for(uint256 i = 0; i < insuranceContracts.length; i++){     
            payInsuranceContract(insuranceContracts[i]);
        }
    }
    
    function payInsuranceContract(address _insuranceContractAddress) private {
        InsuranceContract insuranceContract = InsuranceContract(_insuranceContractAddress);
        if(insuranceContract.isPolicyActive()){
            //Pay the beneficiary
            uint256 withdrawnAmount = insuranceContract.withdraw();
            if(withdrawnAmount < insuranceContract.amountInsured()){
                // The amount we are going to send to the beneficiary is lower than the amount insured! 
                // We will take funds from the insurance to cover losses.
                uint256 diff = insuranceContract.amountInsured() - withdrawnAmount;
                IERC20(tusdTokenAddress).transfer(insuranceContract.beneficiary(), diff);
                withdrawnAmount = diff;
            }
            if(withdrawnAmount > 0){
                emit Payout(insuranceContract.beneficiary(), _insuranceContractAddress, withdrawnAmount);
            }
        }
    }

    function calculateReserveDecreasePercentage(LiquidityAssetPair storage _liquidityAssetPair) private returns(uint256) {
        uint256 percentage = 0;
        ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(_liquidityAssetPair.liquidityProtocol);
        uint256 currentReserve = liquidityProtocol.getReserve(tusdTokenAddress);
        uint256 previousReserve = _liquidityAssetPair.latestReserve;
        if(currentReserve < previousReserve){
            uint256 difference = previousReserve.sub(currentReserve);
            percentage = difference.mul(100).div(previousReserve);
        }
        _liquidityAssetPair.latestReserve = currentReserve;
        return percentage;
    }

    function registerLiquidityAssetPair(LiquidityAssetPair memory _liquidityAssetPair) private returns (uint256) {
        for(uint i = 0; i < liquidityAssetPairs.length; i++) {
            if(equals(_liquidityAssetPair, liquidityAssetPairs[i])){
                return i;
            }
        }
        liquidityAssetPairs.push(_liquidityAssetPair);       
        uint256 liquidityAssetPairIdentifier = liquidityAssetPairs.length - 1;
        return liquidityAssetPairIdentifier;
    }  

    function equals(LiquidityAssetPair memory _first, LiquidityAssetPair memory _second) private pure returns (bool) {
        return _first.liquidityProtocol == _second.liquidityProtocol;
    }

}
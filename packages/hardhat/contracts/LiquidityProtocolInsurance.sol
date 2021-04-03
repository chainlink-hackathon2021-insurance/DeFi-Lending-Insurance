// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/uniswap/IUniswapV2Router02.sol";
import "./interfaces/liquidityProtocol/ILiquidityProtocol.sol";

contract LiquidityProtocolInsurance is Ownable{
    using SafeMath for uint256;

    struct CoverageData{
        address beneficiary;
        uint256 startDate;
        uint256 endDate;
        uint256 amountInsured;
        LiquidityAssetPair liquidityAssetData;
    }

    struct LiquidityAssetPair{
        address asset;
        address liquidityProtocol;
        uint256 latestReserve;
    }

    struct TrackingData {
        bool parameterOne;
        bool parameterTwo;
        bool paid;
    }

    struct InsurancePolicy {
       CoverageData coverageData;
       TrackingData trackingData;
    }

    event InsurancePolicyCreation (
        address indexed beneficiary,
        uint256 indexed insuranceIdentifier
    );
    
    event Payout (
        address indexed beneficiary,
        uint256 indexed insuranceIdentifier,
        uint256 amountPaid
    );

    IUniswapV2Router02 uniswap;
    
    address[] public liquidityProtocolImplementations;
    InsurancePolicy[] public insurancePolicies;
    LiquidityAssetPair[] public liquidityAssetPairs;
    
    mapping(address => uint[]) public insurancePolicyOwnership;
    mapping(uint => uint[]) public liquidityAssetPairToInsurancePolicies;

    uint256 public liquidity;
    address public insuranceLiquidityTokenAddress;

    constructor(address[] memory _liquidityProtocolImplementations, address _insuranceLiquidityTokenAddress, address _uniswapRouterAddress) {
        liquidityProtocolImplementations = _liquidityProtocolImplementations;
        insuranceLiquidityTokenAddress = _insuranceLiquidityTokenAddress;
        uniswap = IUniswapV2Router02(_uniswapRouterAddress);
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

    function registerInsurancePolicy(CoverageData memory _coverageData) public payable validateLiquidityProtocolAddress(_coverageData.liquidityAssetData.liquidityProtocol) 
    returns (uint256) {
        ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(_coverageData.liquidityAssetData.liquidityProtocol);
        uint256 reserve = liquidityProtocol.getReserve(_coverageData.liquidityAssetData.asset);

        LiquidityAssetPair memory pair = LiquidityAssetPair({ liquidityProtocol: _coverageData.liquidityAssetData.liquidityProtocol, 
            asset: _coverageData.liquidityAssetData.asset, latestReserve: reserve});
      
        uint liquidityAssetPairIdentifier = registerLiquidityAssetPair(pair);

        TrackingData memory trackingData = TrackingData({parameterOne: false, parameterTwo: false, paid: false});
        InsurancePolicy memory policy = InsurancePolicy({
            coverageData: _coverageData,
            trackingData: trackingData
        });
        
        
        //Send tokens to liquidity protocol interface contract
        IERC20 asset = IERC20(policy.coverageData.liquidityAssetData.asset);
        asset.transferFrom(msg.sender, policy.coverageData.liquidityAssetData.liquidityProtocol, policy.coverageData.amountInsured);
        
        //Put tokens in liquidity pool
        liquidityProtocol.lockTokens(policy.coverageData.liquidityAssetData.asset, policy.coverageData.amountInsured);
        
        //Return liquidity tokens to the user - 10% which will remain in the contract
        
        IERC20 reserveAsset = IERC20(liquidityProtocol.getReserveTokenAddress(policy.coverageData.liquidityAssetData.asset));
        uint256 amountToKeep = (policy.coverageData.amountInsured * 10) / 100;
        reserveAsset.transfer(msg.sender,  policy.coverageData.amountInsured - amountToKeep);
        
        //convert reserve tokens to underlying token (aTUSD -> TUSD)
        liquidityProtocol.unlockTokens(policy.coverageData.liquidityAssetData.asset, amountToKeep);
        //exchange tokens to stablecoin (TUSD -> DAI)
        uint256 amountIn = asset.balanceOf(address(this));
        address[] memory path = new address[](2);
        path[0] = policy.coverageData.liquidityAssetData.asset;
        path[1] = insuranceLiquidityTokenAddress;
        asset.approve(address(uniswap), amountIn);
        uniswap.swapExactTokensForTokens(
            amountIn, 
            uniswap.getAmountsOut(amountIn, path)[0], 
            path, 
            address(this), 
            block.timestamp);
        //add tokens to insurance liquidity
        
        insurancePolicies.push(policy);
        uint256 insurancePolicyIdentifier = insurancePolicies.length - 1;
        insurancePolicyOwnership[msg.sender].push(insurancePolicyIdentifier);
        
        liquidityAssetPairToInsurancePolicies[liquidityAssetPairIdentifier].push(insurancePolicyIdentifier);

        emit InsurancePolicyCreation(msg.sender, insurancePolicyIdentifier);
        return insurancePolicyIdentifier;
    }

    function isPolicyActive(uint256 _identifier) public view returns(bool){
        InsurancePolicy storage policy = insurancePolicies[_identifier];
        return isPolicyActive(policy);
    }

    //CALLED EXTERNALLY
    function checkParameterOne() public onlyOwner returns(bool) {
        bool shouldMakeTransaction = false;
        for(uint liquidityAssetPairsIdx = 0; liquidityAssetPairsIdx < liquidityAssetPairs.length; liquidityAssetPairsIdx++){
            uint256 decreasePercentage = calculateReserveDecreasePercentage(liquidityAssetPairs[liquidityAssetPairsIdx]);
            if(decreasePercentage > 70){
                shouldMakeTransaction = true;
                for(uint256 insurancePoliciesIdx = 0; insurancePoliciesIdx < liquidityAssetPairToInsurancePolicies[liquidityAssetPairsIdx].length; insurancePoliciesIdx++){
                    uint256 insurancePolicyIdentifier = liquidityAssetPairToInsurancePolicies[liquidityAssetPairsIdx][insurancePoliciesIdx];
                    InsurancePolicy memory policy = insurancePolicies[insurancePolicyIdentifier];
                    if(isPolicyActive(policy)){
                        //Pay the beneficiary
                        IERC20 stableLiquidityToken = IERC20(insuranceLiquidityTokenAddress);
                        stableLiquidityToken.transfer(policy.coverageData.beneficiary, policy.coverageData.amountInsured);
                        emit Payout(policy.coverageData.beneficiary, insurancePolicyIdentifier, policy.coverageData.amountInsured);
                    }
                }
            }
        }
        return shouldMakeTransaction;
    }

    function calculateReserveDecreasePercentage(LiquidityAssetPair memory _liquidityAssetPair) private view returns(uint256) {
        ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(_liquidityAssetPair.liquidityProtocol);
        uint256 currentReserve = liquidityProtocol.getReserve(_liquidityAssetPair.asset);
        uint256 previousReserve = _liquidityAssetPair.latestReserve;

        uint256 difference = previousReserve.sub(currentReserve);
        uint256 percentage = (difference.div(previousReserve)).mul(100);
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

    function isPolicyActive(InsurancePolicy memory _policy) private view returns(bool){
        bool isCurrent = isPolicyCurrent(_policy);
        bool hasBeenPaid = isPolicyPaid(_policy);
        return isCurrent && !hasBeenPaid;
    }

    function isPolicyCurrent(InsurancePolicy memory _policy) private view returns(bool) {
        return block.timestamp >= _policy.coverageData.startDate  && block.timestamp <= _policy.coverageData.endDate;
    }

    function isPolicyPaid(InsurancePolicy memory _policy) private pure returns(bool) {
        return _policy.trackingData.paid;
    }

    function equals(LiquidityAssetPair memory _first, LiquidityAssetPair memory _second) private pure returns (bool) {
        return(keccak256(abi.encodePacked(_first.asset, _first.liquidityProtocol)) == keccak256(abi.encodePacked(_second.asset, _second.liquidityProtocol)));
    }

}
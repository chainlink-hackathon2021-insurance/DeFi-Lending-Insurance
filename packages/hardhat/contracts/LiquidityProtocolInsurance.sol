// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.3;

import "./interfaces/liquidityProtocol/ILiquidityProtocol.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract LiquidityProtocolInsurance {

    struct CoverageData{
        uint256 startDate;
        uint256 endDate;
        uint256 amountInsured;
        address asset;
        address liquidityProtocol;
    }

    struct TrackingData {
        bool parameterOne;
        bool parameterTwo;
    }

    struct InsurancePolicy {
       CoverageData coverageData;
       TrackingData trackingData;
    }

    event InsurancePolicyCreation (
        address indexed beneficiary,
        uint256 indexed insuranceIdentifier
    );
    
    address[] public liquidityProtocolImplementations;
    InsurancePolicy[] public insurancePolicies;
    
    
    mapping(address => uint[]) public insurancePolicyOwnership;
    mapping(uint => uint[]) public liquidityProtocolIdToRelatedInsuranceId;

    constructor(address[] memory _liquidityProtocolImplementations) {
        liquidityProtocolImplementations = _liquidityProtocolImplementations;
    }
    
    function registerInsurancePolicy(CoverageData memory _coverageData)
    public payable returns (uint256) {
        TrackingData memory trackingData = TrackingData({parameterOne: false, parameterTwo: false});
        InsurancePolicy memory policy = InsurancePolicy({
            coverageData: _coverageData,
            trackingData: trackingData
        });

        //Send tokens to liquidity protocol interface contract
        IERC20 asset = IERC20(policy.coverageData.asset);
        asset.transferFrom(msg.sender, policy.coverageData.liquidityProtocol, policy.coverageData.amountInsured);
        
        //Put tokens in liquidity pool
        ILiquidityProtocol liquidityProtocol = ILiquidityProtocol(policy.coverageData.liquidityProtocol);
        liquidityProtocol.lockTokens(policy.coverageData.asset, policy.coverageData.amountInsured);
        
        //Return liquidity tokens to the user - 10% which will remain in the contract
        
        IERC20 reserveAsset = IERC20(liquidityProtocol.getReserveTokenAddress(policy.coverageData.asset));
        uint256 amountToReturn = policy.coverageData.amountInsured - (policy.coverageData.amountInsured * 10) / 100;
        reserveAsset.transfer(msg.sender, amountToReturn);
        
        //Convert to reserve
        
        
        insurancePolicies.push(policy);
        uint256 identifier = insurancePolicies.length - 1;
        insurancePolicyOwnership[msg.sender].push(identifier);
        emit InsurancePolicyCreation(msg.sender, identifier);
        return identifier;
    }


    function isPolicyActive(uint256 _identifier) public view returns(bool){
        InsurancePolicy storage policy = insurancePolicies[_identifier];
        return block.timestamp >= policy.coverageData.startDate && block.timestamp <= policy.coverageData.endDate;
    }

    function isPolicyActive(InsurancePolicy memory _policy) private view returns(bool){
        return block.timestamp >= _policy.coverageData.startDate
        && block.timestamp <= _policy.coverageData.endDate;
    }

    //TODO: Add onlyAdmin modifier (or chainlink oracle only?)
    function checkParameterOne() public {
        //Check reserve pool of every liquidity protocol
        for(uint i = 0; i < insurancePolicies.length; i++) {
            InsurancePolicy storage insurancePolicy = insurancePolicies[i];
            if(isPolicyActive(insurancePolicy)){
                
            }
        }
    }



}
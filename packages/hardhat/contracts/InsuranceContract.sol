// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/liquidityProtocol/ILiquidityProtocol.sol";
import "./LiquidityProtocolInsurance.sol";

contract InsuranceContract is Ownable {

    address public beneficiary;
    uint256 public startDate;
    uint256 public endDate;
    uint256 public amountInsured;
    bool paid;
    IERC20 internal asset;
    IERC20 internal reserveToken;
    
    ILiquidityProtocol internal liquidityProtocol;
    LiquidityProtocolInsurance internal liquidityProtocolInsurance;
    
    constructor(
                uint256 _startDate,
                uint256 _endDate,
                uint256 _amountInsured,
                address _liquidityProtocol,
                address _beneficiary, 
                address _assetAddress,
                address _liquidityProtocolInsuranceAddress) {
        startDate = _startDate;
        endDate = _endDate;
        amountInsured = _amountInsured;
        beneficiary = _beneficiary;

        asset = IERC20(_assetAddress);
        liquidityProtocol = ILiquidityProtocol(_liquidityProtocol);
        liquidityProtocolInsurance = LiquidityProtocolInsurance(_liquidityProtocolInsuranceAddress);
        
        address reserveTokenAddress = liquidityProtocol.getReserveTokenAddress(_assetAddress);
        reserveToken = IERC20(reserveTokenAddress);

        transferOwnership(_liquidityProtocolInsuranceAddress);
    }

    function withdraw() external onlyOwner returns (uint256) {
        liquidityProtocol.unlockTokens(address(asset), reserveToken.balanceOf(address(this)));
        uint256 amountToWithdraw = asset.balanceOf(address(this));
        asset.transfer(beneficiary, amountToWithdraw);
        paid = true;
        return amountToWithdraw;
    }

    function isPolicyCurrent() public view returns(bool) {
        return block.timestamp >= startDate && block.timestamp <= endDate;
    }

    function isPolicyActive() public view returns(bool){
        bool isCurrent = isPolicyCurrent();
        return isCurrent && !paid;
    }
}

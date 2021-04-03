// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ReserveTokenMock.sol";
import "../interfaces/liquidityProtocol/ILiquidityProtocol.sol";

//Test Mock contract used for unit tests. DO NOT deploy this!
contract LiquidityProtocolMock is ILiquidityProtocol {

    ReserveTokenMock private reserveToken;

    mapping(address => uint256) public reserves;
    mapping(address => address) public reserveTokenToUnderlyingToken;
    mapping(address => address) public underlyingTokenToReserveToken;

    constructor () {
        reserveToken = new ReserveTokenMock();
    }

    function getReserve(address asset) override external view returns (uint256){
        return reserves[asset];
    }

    function lockTokens(address asset, uint256 amount) override external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        reserves[asset] += amount;
        //Assumption: This contract has a considerable amount 
        reserveToken.transfer(msg.sender, amount);
    }
    
    function getReserveTokenAddress(address asset) override external view returns (address){
        return underlyingTokenToReserveToken[asset];
    }
    
    function unlockTokens(address asset, uint256 amount) override external{
        reserveToken.burn(msg.sender, amount);
        IERC20(asset).transfer(msg.sender, amount);
    }

}
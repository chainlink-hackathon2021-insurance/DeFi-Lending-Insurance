// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./ReserveTokenMock.sol";
import "./interfaces/liquidityProtocol/ILiquidityProtocol.sol";

//Test Mock contract used for unit tests. DO NOT deploy this!
contract LiquidityProtocolMock is ILiquidityProtocol {

    ReserveTokenMock private reserveToken;
    
    mapping(address => uint256) public reserves;

    constructor (address _reserveTokenAddress) {
        reserveToken = ReserveTokenMock(_reserveTokenAddress);
        reserveToken.faucet(address(this), 2000 ether);
    }

    function getReserve(address asset) override external view returns (uint256){
        return reserves[asset];
    }

    function lockTokens(address asset, uint256 amount) override external {
        reserves[asset] += amount;
        reserveToken.transfer(msg.sender, amount);
    }
    
    function getReserveTokenAddress(address asset) override external view returns (address){
        return address(reserveToken);
    }
    
    function unlockTokens(address asset, uint256 amount) override external{
        reserveToken.burn(address(this), amount);
        IERC20(asset).transfer(msg.sender, amount);
    }

    function setReserve(address asset, uint256 amount) external {
        reserves[asset] = amount;
    }

}
// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import "../interfaces/uniswap/IUniswapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./DaiMock.sol";
import "./TUSDMock.sol";

contract IUniswapRouterMock is IUniswapRouter{

    DaiMock private daiMock;
    TUSDMock private tusdMock;
    

    constructor(address _daiMockAddress, address _tusdTokenMockAddress){
        tusdMock = TUSDMock(_tusdTokenMockAddress);
        daiMock = DaiMock(_daiMockAddress);
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) override external returns (uint[] memory _amounts){
        uint[] memory amounts = new uint[](1);
        amounts[0] = amountOutMin;
        daiMock.faucet(to, amountOutMin);
        tusdMock.burn(to, amountIn);
        return amounts;
    }
   
    function getAmountsOut(uint amountIn, address[] calldata path) override external view returns (uint[] memory _amounts){
        uint[] memory amounts = new uint[](1);
        amounts[0] = amountIn;
        return amounts;
    }
}
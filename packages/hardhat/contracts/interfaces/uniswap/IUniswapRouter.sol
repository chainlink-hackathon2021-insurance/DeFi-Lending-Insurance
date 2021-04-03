//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

interface IUniswapRouter {
  
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
   
    function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
}
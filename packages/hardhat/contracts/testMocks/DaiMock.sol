// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DaiMock is ERC20{

    constructor() ERC20("DAI Mock", "MDAI"){
        _mint(msg.sender, 2000 ether);
    }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
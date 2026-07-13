// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice A fixed-supply ERC-20 used by the local Uniswap V2 demo.
contract DemoToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Demo Token", "DTT") {
        _mint(msg.sender, initialSupply);
    }
}


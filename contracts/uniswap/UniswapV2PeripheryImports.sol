// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.6.6;

// Compile the canonical router and the WETH9 contract used for local ETH pairs.
import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/test/WETH9.sol";

contract LocalUniswapV2Router02 is UniswapV2Router02 {
    constructor(address factory, address weth)
        public
        UniswapV2Router02(factory, weth)
    {}
}

contract LocalWETH9 is WETH9 {}

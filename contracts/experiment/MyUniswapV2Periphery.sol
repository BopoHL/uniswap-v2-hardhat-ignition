// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.6.6;

import "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/test/WETH9.sol";

contract MyUniswapV2Router02 is UniswapV2Router02 {
    constructor(address factory, address weth)
        public
        UniswapV2Router02(factory, weth)
    {}
}

contract MyWETH9 is WETH9 {}

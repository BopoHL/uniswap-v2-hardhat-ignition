// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.5.16;

import "@uniswap/v2-core/contracts/UniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/UniswapV2Pair.sol";

// This deliberately recompiles the Uniswap Factory and Pair through Hardhat.
// The new contract name is harmless; the changed source metadata is not.
contract MyUniswapV2Factory is UniswapV2Factory {
    constructor(address feeToSetter)
        public
        UniswapV2Factory(feeToSetter)
    {}

    function compiledPairCodeHash() external pure returns (bytes32) {
        return keccak256(type(UniswapV2Pair).creationCode);
    }
}

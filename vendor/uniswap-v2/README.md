# Uniswap V2 source snapshot

This directory contains unchanged source files from the exact package versions
used by this project:

- `@uniswap/v2-core@1.0.1`;
- `@uniswap/v2-periphery@1.1.0-beta.0`;
- `@uniswap/lib@1.1.1` (`TransferHelper` only).

They are committed so the protocol implementation can be inspected directly
in this repository without opening `node_modules`.

## Main contracts

- [`core/contracts/UniswapV2Factory.sol`](core/contracts/UniswapV2Factory.sol)
  creates and registers token pairs.
- [`core/contracts/UniswapV2Pair.sol`](core/contracts/UniswapV2Pair.sol)
  stores reserves, mints LP tokens, and executes swaps.
- [`core/contracts/UniswapV2ERC20.sol`](core/contracts/UniswapV2ERC20.sol)
  implements the LP token and permit functionality.
- [`periphery/contracts/UniswapV2Router02.sol`](periphery/contracts/UniswapV2Router02.sol)
  provides user-facing liquidity and swap operations.
- [`periphery/contracts/test/WETH9.sol`](periphery/contracts/test/WETH9.sol)
  wraps ETH as an ERC-20-compatible token.
- [`periphery/contracts/libraries/UniswapV2Library.sol`](periphery/contracts/libraries/UniswapV2Library.sol)
  calculates pair addresses, quotes, and swap amounts.
- [`lib/contracts/libraries/TransferHelper.sol`](lib/contracts/libraries/TransferHelper.sol)
  safely transfers ERC-20 tokens and ETH.

The required interfaces and math libraries are included beside those files.
Examples, migration contracts, test tokens, and unused oracle contracts are not
included because this project does not deploy or call them.

## Why this is a source snapshot

Hardhat compiles the same source through the pinned npm packages. The Ignition
module deploys the official `@uniswap/v2-core` Factory artifact so its Pair
creation bytecode keeps the canonical hash expected by `UniswapV2Library`.
Compiling the copied Factory from a different source path would change Solidity
metadata and therefore the Pair creation-code hash.

Keeping this snapshot outside `contracts/` makes the protocol readable without
silently changing the bytecode used by the tested deployment.

All copied files are distributed under the upstream GPL-3.0-or-later license;
see [`LICENSE`](LICENSE).

After installing dependencies, verify every copied file against its package
source (normalizing only the optional final newline) with:

```bash
npm run verify:vendor
```

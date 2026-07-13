# Uniswap V2 Hardhat Ignition demo

This project deploys a complete Uniswap V2 environment with Hardhat Ignition:

- the canonical Uniswap V2 Factory and Pair bytecode;
- Uniswap V2 Router02 and WETH9;
- a custom OpenZeppelin ERC-20 called Demo Token (`DTT`);
- an ETH/DTT liquidity pool;
- three example swaps with balance and invariant checks.

The project supports both a local Hardhat node and the Sepolia testnet.

## Live Sepolia deployment

The contracts and pool are deployed on chain ID `11155111`:

| Contract | Address |
| --- | --- |
| Demo Token (DTT) | [`0xE580...1E8c`](https://sepolia.etherscan.io/address/0xE5802D12Ab1A7D4768361cc0778E86Ba84531E8c) |
| WETH9 | [`0x72A3...403E`](https://sepolia.etherscan.io/address/0x72A3aF7f5719eBF341c4Ee0c5B2D5087b184403E) |
| Uniswap V2 Factory | [`0x07D3...e9d2`](https://sepolia.etherscan.io/address/0x07D3e3DCc4890499a392D6EeD2A5301f9d9ce9d2) |
| Uniswap V2 Router02 | [`0xb441...962e`](https://sepolia.etherscan.io/address/0xb4410E70ce835F3f091b4A3b7d323DC76F20962e) |
| ETH/DTT Pair | [`0x52dA...38E4`](https://sepolia.etherscan.io/address/0x52dA4d633CC611469fd345A854B7DA741FCf38E4) |

The pool was seeded with 0.01 ETH and 10,000 DTT. All three example trades
completed on Sepolia. Machine-readable addresses and transaction hashes are in
[`deployments/sepolia.json`](deployments/sepolia.json).

## Requirements

- Node.js 22.10 or newer
- npm 10 or newer
- Git
- Sepolia ETH for testnet deployment
- a Sepolia RPC URL and a test-only private key for testnet deployment

## 1. Clone and install

```bash
git clone https://github.com/BopoHL/uniswap-v2-hardhat-ignition.git
cd uniswap-v2-hardhat-ignition
npm install
```

## 2. Compile the contracts

```bash
npm run compile
```

Hardhat uses three Solidity compilers because the canonical Uniswap V2 source
spans Solidity 0.5.16 and 0.6.6, while OpenZeppelin Contracts 5 uses Solidity
0.8.x.

## 3. Run everything on an ephemeral local chain

```bash
npm run demo
```

This command deploys the Ignition module, creates the pool, supplies 100 ETH and
100,000 DTT, performs three swaps, and checks the pool invariant. The chain is
discarded when the command exits.

## 4. Run on a persistent local Hardhat node

Start the node in the first terminal:

```bash
npm run node
```

Deploy the contracts with Ignition in a second terminal:

```bash
npm run deploy:localhost
```

Create the pool, add liquidity, and execute the swaps:

```bash
npm run pool:localhost
```

The local node listens on `http://127.0.0.1:8545`.

## 5. Configure Sepolia

Copy the environment template:

```bash
cp .env.example .env
```

Set these required values in `.env`:

```dotenv
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xYOUR_TEST_PRIVATE_KEY
```

Use only a dedicated testnet key. Never commit `.env`, and never use a wallet
that controls mainnet assets. The file is excluded by `.gitignore`.

The optional liquidity variables in `.env.example` default to:

- 0.01 ETH and 10,000 DTT initial liquidity;
- 0.0001 ETH for the first buy;
- 20 DTT for the sell;
- 0.00005 ETH for the final buy.

## 6. Deploy to Sepolia with Hardhat Ignition

```bash
npm run deploy:sepolia
```

Ignition deploys `DemoToken`, the canonical `UniswapV2Factory`, `LocalWETH9`,
and `LocalUniswapV2Router02`. Its deployment journal is written under
`ignition/deployments/chain-11155111/` and can safely resume an interrupted
deployment.

## 7. Create the Sepolia pool and execute trades

```bash
npm run pool:sepolia
```

The script resumes the Ignition deployment, creates the WETH/DTT pair, adds
liquidity if the pair is empty, and performs three swaps through Router02. It
prints all addresses, swap amounts, and final reserves.

## Project structure

```text
contracts/
  DemoToken.sol                         OpenZeppelin ERC-20
  uniswap/                              Canonical V2 source entrypoints
vendor/uniswap-v2/
  core/contracts/                       Factory, Pair, LP token, interfaces
  periphery/contracts/                  Router02, WETH9, interfaces, libraries
  lib/contracts/libraries/              TransferHelper
  README.md                              Source map and provenance
ignition/modules/
  UniswapV2Module.js                    Ignition deployment module
scripts/
  create-pool-and-trade.js              Liquidity and swap workflow
deployments/
  sepolia.json                          Live addresses and transactions
hardhat.config.js                       Compilers and network configuration
.env.example                            Sepolia configuration template
```

## Uniswap V2 source code in this repository

The exact upstream Solidity files used by the pinned dependencies are committed
under [`vendor/uniswap-v2`](vendor/uniswap-v2/README.md), so they can be reviewed
directly on GitHub:

- [`UniswapV2Factory.sol`](vendor/uniswap-v2/core/contracts/UniswapV2Factory.sol)
  creates Pair contracts;
- [`UniswapV2Pair.sol`](vendor/uniswap-v2/core/contracts/UniswapV2Pair.sol)
  holds reserves, mints LP tokens, and performs swaps;
- [`UniswapV2ERC20.sol`](vendor/uniswap-v2/core/contracts/UniswapV2ERC20.sol)
  implements the UNI-V2 liquidity token;
- [`UniswapV2Router02.sol`](vendor/uniswap-v2/periphery/contracts/UniswapV2Router02.sol)
  exposes liquidity and trading functions;
- [`WETH9.sol`](vendor/uniswap-v2/periphery/contracts/test/WETH9.sol)
  wraps native ETH for ERC-20 pools;
- [`UniswapV2Library.sol`](vendor/uniswap-v2/periphery/contracts/libraries/UniswapV2Library.sol)
  calculates pair addresses and trade amounts.

The snapshot is copied unchanged from `@uniswap/v2-core@1.0.1`,
`@uniswap/v2-periphery@1.1.0-beta.0`, and `@uniswap/lib@1.1.1`. It stays outside
the Hardhat `contracts/` source root to preserve the canonical bytecode and Pair
init-code hash used by the deployed protocol.

## Why the Factory uses the official artifact

The canonical Router02 library contains the Pair creation-code hash
`0x96e8ac...845f`. Solidity metadata includes source paths, so recompiling the
Pair through Hardhat 3's npm source namespace changes that hash. The Ignition
module therefore deploys the official Factory artifact shipped by
`@uniswap/v2-core`, while Router02 and WETH9 are compiled from their official
source through thin local inheritance harnesses. The trading script verifies
the canonical Pair hash before making any transaction.

## Commands

```bash
npm run compile          # compile all contracts
npm test                 # run the assertion-backed ephemeral demo
npm run demo             # same full ephemeral demo
npm run node             # start a persistent local node
npm run deploy:localhost # deploy the Ignition module locally
npm run pool:localhost   # create pool and execute local trades
npm run deploy:sepolia   # deploy the Ignition module to Sepolia
npm run pool:sepolia     # create pool and execute Sepolia trades
npm run verify:vendor    # verify committed Uniswap sources match npm packages
```

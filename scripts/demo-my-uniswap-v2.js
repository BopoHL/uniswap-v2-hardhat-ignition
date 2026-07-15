import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { network } from "hardhat";
import MyUniswapV2Module, { MY_PAIR_CODE_HASH } from "../ignition/modules/MyUniswapV2Module.js";

const connection = await network.create();
const { ethers, ignition } = connection;
const require = createRequire(import.meta.url);
const pairArtifact = require("../artifacts/contracts/custom/MyUniswapV2Pair.sol/MyUniswapV2Pair.json");

const BPS = 10_000n;
const SLIPPAGE_BPS = 100n;
const LIVE_GAS_LIMITS = {
  approve: 150_000n,
  addLiquidity: 4_000_000n,
  swap: 500_000n,
};

function minimumWithSlippage(amount) {
  return (amount * (BPS - SLIPPAGE_BPS)) / BPS;
}

function fmt(amount) {
  return ethers.formatEther(amount);
}

function parseAmount(name, fallback) {
  return ethers.parseEther(process.env[name] ?? fallback);
}

function transactionOverrides(chainId, gasLimit, overrides = {}) {
  if (chainId === 31337n) {
    return overrides;
  }

  // Public RPC estimates can lag immediately after the preceding transaction.
  // An explicit ceiling prevents a valid Sepolia swap from running out of gas;
  // only gas actually consumed is charged.
  return { ...overrides, gasLimit };
}

function amountsFor(chainId) {
  if (chainId === 31337n) {
    return {
      tokenLiquidity: ethers.parseEther("100000"),
      ethLiquidity: ethers.parseEther("100"),
      firstEthTrade: ethers.parseEther("1"),
      tokenSellTrade: ethers.parseEther("200"),
      secondEthTrade: ethers.parseEther("0.5"),
    };
  }

  return {
    tokenLiquidity: parseAmount("TOKEN_LIQUIDITY", "10000"),
    ethLiquidity: parseAmount("ETH_LIQUIDITY", "0.01"),
    firstEthTrade: parseAmount("FIRST_ETH_TRADE", "0.0001"),
    tokenSellTrade: parseAmount("TOKEN_SELL_TRADE", "20"),
    secondEthTrade: parseAmount("SECOND_ETH_TRADE", "0.00005"),
  };
}

async function deadline() {
  const block = await ethers.provider.getBlock("latest");
  return BigInt(block.timestamp + 3_600);
}

async function reserves(pair, wethAddress) {
  const token0 = await pair.token0();
  const [reserve0, reserve1] = await pair.getReserves();

  if (token0.toLowerCase() === wethAddress.toLowerCase()) {
    return { eth: reserve0, token: reserve1 };
  }

  return { eth: reserve1, token: reserve0 };
}

async function main() {
  const pairHash = ethers.keccak256(pairArtifact.bytecode);
  assert.equal(pairHash, MY_PAIR_CODE_HASH);

  const networkInfo = await ethers.provider.getNetwork();
  const chainId = networkInfo.chainId;
  const amounts = amountsFor(chainId);
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const trader = signers[1] ?? deployer;
  const deployerAddress = await deployer.getAddress();
  const traderAddress = await trader.getAddress();

  // Ignition deploys the module on a fresh chain or resumes its recorded
  // deployment on localhost/Sepolia.
  const { token, factory, weth, router } = await ignition.deploy(
    MyUniswapV2Module,
  );

  const tokenAddress = await token.getAddress();
  const factoryAddress = await factory.getAddress();
  const wethAddress = await weth.getAddress();
  const routerAddress = await router.getAddress();
  const factoryPairHash = await factory.pairCodeHash();
  const routerPairHash = await router.pairCodeHash();

  assert.equal(factoryPairHash, pairHash);
  assert.equal(routerPairHash, pairHash);

  console.log(`Network: ${networkInfo.name} (${chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Trader:   ${traderAddress}`);
  console.log("\nIgnition deployments");
  console.log(`  Demo Token (DTT):    ${tokenAddress}`);
  console.log(`  MyUniswap V2 Factory: ${factoryAddress}`);
  console.log(`  WETH9:               ${wethAddress}`);
  console.log(`  MyUniswap V2 Router02: ${routerAddress}`);
  console.log(`  Pair artifact hash:  ${pairHash}`);
  console.log(`  Factory Pair hash:   ${factoryPairHash}`);
  console.log(`  Router configured:   ${routerPairHash}`);
  console.log("  Artifact = Factory = Router (verified)");

  let pairAddress = await factory.getPair(tokenAddress, wethAddress);
  let pair;
  let currentReserves = { eth: 0n, token: 0n };

  if (pairAddress !== ethers.ZeroAddress) {
    pair = new ethers.Contract(pairAddress, pairArtifact.abi, deployer);
    currentReserves = await reserves(pair, wethAddress);
  }

  if (currentReserves.eth === 0n || currentReserves.token === 0n) {
    await (
      await token.approve(
        routerAddress,
        amounts.tokenLiquidity,
        transactionOverrides(chainId, LIVE_GAS_LIMITS.approve),
      )
    ).wait();
    await (
      await router.addLiquidityETH(
        tokenAddress,
        amounts.tokenLiquidity,
        minimumWithSlippage(amounts.tokenLiquidity),
        minimumWithSlippage(amounts.ethLiquidity),
        deployerAddress,
        await deadline(),
        transactionOverrides(chainId, LIVE_GAS_LIMITS.addLiquidity, {
          value: amounts.ethLiquidity,
        }),
      )
    ).wait();

    pairAddress = await factory.getPair(tokenAddress, wethAddress);
    pair = new ethers.Contract(pairAddress, pairArtifact.abi, deployer);
    currentReserves = await reserves(pair, wethAddress);

    const [token0, token1] =
      BigInt(tokenAddress) < BigInt(wethAddress)
        ? [tokenAddress, wethAddress]
        : [wethAddress, tokenAddress];
    const salt = ethers.keccak256(
      ethers.solidityPacked(["address", "address"], [token0, token1]),
    );
    const predictedPair = ethers.getCreate2Address(
      factoryAddress,
      salt,
      pairHash,
    );
    assert.equal(pairAddress, predictedPair);

    console.log("\nLiquidity added");
    console.log(`  CREATE2 predicted Pair: ${predictedPair} (verified)`);
  } else {
    console.log("\nExisting pool liquidity detected; seeding skipped");
  }

  const lpBalance = await pair.balanceOf(deployerAddress);
  assert.notEqual(pairAddress, ethers.ZeroAddress);
  assert.equal(await factory.allPairsLength(), 1n);
  assert(currentReserves.eth > 0n && currentReserves.token > 0n);

  console.log(`  Pair:          ${pairAddress}`);
  console.log(`  ETH reserve:   ${fmt(currentReserves.eth)} ETH`);
  console.log(`  Token reserve: ${fmt(currentReserves.token)} DTT`);
  console.log(`  LP balance:    ${fmt(lpBalance)} UNI-V2`);

  const initialK = currentReserves.eth * currentReserves.token;
  const pathToToken = [wethAddress, tokenAddress];
  const pathToEth = [tokenAddress, wethAddress];

  const firstQuote = await router.getAmountsOut(
    amounts.firstEthTrade,
    pathToToken,
  );
  const tokenBeforeFirstTrade = await token.balanceOf(traderAddress);
  await (
    await router
      .connect(trader)
      .swapExactETHForTokens(
        minimumWithSlippage(firstQuote[1]),
        pathToToken,
        traderAddress,
        await deadline(),
        transactionOverrides(chainId, LIVE_GAS_LIMITS.swap, {
          value: amounts.firstEthTrade,
        }),
      )
  ).wait();
  const tokenAfterFirstTrade = await token.balanceOf(traderAddress);
  const firstTokenOut = tokenAfterFirstTrade - tokenBeforeFirstTrade;
  assert(firstTokenOut >= minimumWithSlippage(firstQuote[1]));
  console.log(
    `\nTrade 1: ${fmt(amounts.firstEthTrade)} ETH -> ${fmt(firstTokenOut)} DTT`,
  );

  const secondQuote = await router.getAmountsOut(
    amounts.tokenSellTrade,
    pathToEth,
  );
  await (
    await token
      .connect(trader)
      .approve(
        routerAddress,
        amounts.tokenSellTrade,
        transactionOverrides(chainId, LIVE_GAS_LIMITS.approve),
      )
  ).wait();
  await (
    await router
      .connect(trader)
      .swapExactTokensForETH(
        amounts.tokenSellTrade,
        minimumWithSlippage(secondQuote[1]),
        pathToEth,
        traderAddress,
        await deadline(),
        transactionOverrides(chainId, LIVE_GAS_LIMITS.swap),
      )
  ).wait();
  const tokenAfterSecondTrade = await token.balanceOf(traderAddress);
  assert.equal(
    tokenAfterFirstTrade - tokenAfterSecondTrade,
    amounts.tokenSellTrade,
  );
  console.log(
    `Trade 2: ${fmt(amounts.tokenSellTrade)} DTT -> ${fmt(secondQuote[1])} ETH`,
  );

  const thirdQuote = await router.getAmountsOut(
    amounts.secondEthTrade,
    pathToToken,
  );
  await (
    await router
      .connect(trader)
      .swapExactETHForTokens(
        minimumWithSlippage(thirdQuote[1]),
        pathToToken,
        traderAddress,
        await deadline(),
        transactionOverrides(chainId, LIVE_GAS_LIMITS.swap, {
          value: amounts.secondEthTrade,
        }),
      )
  ).wait();
  const tokenAfterThirdTrade = await token.balanceOf(traderAddress);
  const thirdTokenOut = tokenAfterThirdTrade - tokenAfterSecondTrade;
  assert(thirdTokenOut >= minimumWithSlippage(thirdQuote[1]));
  console.log(
    `Trade 3: ${fmt(amounts.secondEthTrade)} ETH -> ${fmt(thirdTokenOut)} DTT`,
  );

  const finalReserves = await reserves(pair, wethAddress);
  const finalK = finalReserves.eth * finalReserves.token;
  assert(finalK >= initialK, "Pool invariant should not decrease after swaps");

  console.log("\nFinal pool state");
  console.log(`  ETH reserve:   ${fmt(finalReserves.eth)} ETH`);
  console.log(`  Token reserve: ${fmt(finalReserves.token)} DTT`);
  console.log(`  Trader DTT:    ${fmt(tokenAfterThirdTrade)} DTT`);
  console.log("\nCustom MyFactory/MyPair/MyLibrary/MyRouter flow and 3 swaps verified.");
}

try {
  await main();
} finally {
  await connection.close();
}


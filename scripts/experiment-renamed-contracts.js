import assert from "node:assert/strict";
import { network } from "hardhat";
import RenamedUniswapExperimentModule from "../ignition/modules/RenamedUniswapExperimentModule.js";

const CANONICAL_PAIR_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

function pairAddress(ethers, factory, tokenA, tokenB, pairHash) {
  const [token0, token1] =
    BigInt(tokenA) < BigInt(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
  const salt = ethers.keccak256(
    ethers.solidityPacked(["address", "address"], [token0, token1]),
  );

  return ethers.getCreate2Address(factory, salt, pairHash);
}

const connection = await network.create();
const { ethers, ignition } = connection;

try {
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const { token, factory, weth, router } = await ignition.deploy(
    RenamedUniswapExperimentModule,
  );

  const tokenAddress = await token.getAddress();
  const factoryAddress = await factory.getAddress();
  const wethAddress = await weth.getAddress();
  const routerAddress = await router.getAddress();
  const compiledPairHash = await factory.compiledPairCodeHash();

  console.log("Renamed wrapper contracts deployed successfully");
  console.log(`  MyFactory: ${factoryAddress}`);
  console.log(`  MyRouter:  ${routerAddress}`);
  console.log(`  MyWETH9:   ${wethAddress}`);
  console.log("\nPair creation-code hashes");
  console.log(`  Router hardcoded: ${CANONICAL_PAIR_HASH}`);
  console.log(`  Factory compiled: ${compiledPairHash}`);

  assert.notEqual(
    compiledPairHash,
    CANONICAL_PAIR_HASH,
    "The experiment requires a non-canonical Hardhat Pair build",
  );

  await (await factory.createPair(tokenAddress, wethAddress)).wait();

  const actualPair = await factory.getPair(tokenAddress, wethAddress);
  const factoryPredictedPair = pairAddress(
    ethers,
    factoryAddress,
    tokenAddress,
    wethAddress,
    compiledPairHash,
  );
  const routerPredictedPair = pairAddress(
    ethers,
    factoryAddress,
    tokenAddress,
    wethAddress,
    CANONICAL_PAIR_HASH,
  );

  assert.equal(actualPair, factoryPredictedPair);
  assert.notEqual(actualPair, routerPredictedPair);

  const actualPairCode = await ethers.provider.getCode(actualPair);
  const routerPairCode = await ethers.provider.getCode(routerPredictedPair);

  console.log("\nPair addresses");
  console.log(`  Factory created:  ${actualPair}`);
  console.log(`  Router calculates: ${routerPredictedPair}`);
  console.log(`  Code at Factory address: ${actualPairCode.length / 2 - 1} bytes`);
  console.log(`  Code at Router address:  ${routerPairCode}`);

  const tokenLiquidity = ethers.parseEther("100000");
  const ethLiquidity = ethers.parseEther("100");
  await (await token.approve(routerAddress, tokenLiquidity)).wait();

  const latestBlock = await ethers.provider.getBlock("latest");

  try {
    await router.addLiquidityETH(
      tokenAddress,
      tokenLiquidity,
      tokenLiquidity,
      ethLiquidity,
      deployerAddress,
      BigInt(latestBlock.timestamp + 3600),
      { value: ethLiquidity },
    );
    assert.fail("addLiquidityETH unexpectedly succeeded");
  } catch (error) {
    const message = error.shortMessage ?? error.message;
    console.log("\nExpected addLiquidityETH failure");
    console.log(`  ${message}`);
  }

  const pair = new ethers.Contract(
    actualPair,
    ["function getReserves() view returns (uint112,uint112,uint32)"],
    deployer,
  );
  const [reserve0, reserve1] = await pair.getReserves();

  assert.equal(reserve0, 0n);
  assert.equal(reserve1, 0n);
  console.log("  Actual Pair reserves remain 0 / 0");
  console.log("\nExperiment reproduced the Router/Factory init-code hash mismatch.");
} finally {
  await connection.close();
}

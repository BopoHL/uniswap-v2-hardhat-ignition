import { createRequire } from "node:module";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const require = createRequire(import.meta.url);
const factoryBuild = require("@uniswap/v2-core/build/UniswapV2Factory.json");

// The official npm build preserves the canonical pair creation-code hash used
// by UniswapV2Library. Hardhat 3's npm source names change compiler metadata,
// so recompiling the factory would produce a different pair address hash.
const factoryArtifact = {
  _format: "hh3-artifact-1",
  contractName: "UniswapV2Factory",
  sourceName: "@uniswap/v2-core/contracts/UniswapV2Factory.sol",
  abi: factoryBuild.abi,
  bytecode: `0x${factoryBuild.bytecode}`,
  deployedBytecode: `0x${factoryBuild.evm.deployedBytecode.object}`,
  linkReferences: factoryBuild.evm.bytecode.linkReferences ?? {},
  deployedLinkReferences:
    factoryBuild.evm.deployedBytecode.linkReferences ?? {},
};

export default buildModule("UniswapV2Module", (m) => {
  const deployer = m.getAccount(0);
  const initialSupply = m.getParameter(
    "initialSupply",
    1_000_000n * 10n ** 18n,
  );

  const token = m.contract("DemoToken", [initialSupply]);
  const factory = m.contract(
    "UniswapV2Factory",
    factoryArtifact,
    [deployer],
  );
  const weth = m.contract("LocalWETH9");
  const router = m.contract("LocalUniswapV2Router02", [factory, weth]);

  return { token, factory, weth, router };
});


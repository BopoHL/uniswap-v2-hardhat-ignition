import { createRequire } from "node:module";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { keccak256 } from "ethers";

const require = createRequire(import.meta.url);
const pairArtifact = require(
  "../../artifacts/contracts/custom/MyUniswapV2Pair.sol/MyUniswapV2Pair.json",
);

// The Router receives the hash of the exact MyPair creation bytecode produced
// by this Hardhat build. There is no copied or canonical Uniswap hash here.
export const MY_PAIR_CODE_HASH = keccak256(pairArtifact.bytecode);

export default buildModule("MyUniswapV2Module", (m) => {
  const deployer = m.getAccount(0);
  const initialSupply = m.getParameter(
    "initialSupply",
    1_000_000n * 10n ** 18n,
  );

  const token = m.contract("DemoToken", [initialSupply]);
  const factory = m.contract(
    "contracts/custom/MyUniswapV2Factory.sol:MyUniswapV2Factory",
    [deployer],
  );
  const weth = m.contract(
    "contracts/custom/MyCustomWETH9.sol:MyCustomWETH9",
  );
  const router = m.contract(
    "contracts/custom/MyUniswapV2Router02.sol:MyUniswapV2Router02",
    [factory, weth, MY_PAIR_CODE_HASH],
  );

  return { token, factory, weth, router };
});


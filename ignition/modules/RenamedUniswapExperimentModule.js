import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("RenamedUniswapExperimentModule", (m) => {
  const deployer = m.getAccount(0);
  const token = m.contract("DemoToken", [1_000_000n * 10n ** 18n]);
  const factory = m.contract(
    "contracts/experiment/MyUniswapV2Factory.sol:MyUniswapV2Factory",
    [deployer],
  );
  const weth = m.contract(
    "contracts/experiment/MyUniswapV2Periphery.sol:MyWETH9",
  );
  const router = m.contract(
    "contracts/experiment/MyUniswapV2Periphery.sol:MyUniswapV2Router02",
    [factory, weth],
  );

  return { token, factory, weth, router };
});

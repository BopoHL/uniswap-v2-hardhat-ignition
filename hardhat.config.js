import "dotenv/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const compilers = [
  {
    version: "0.5.16",
    settings: {
      // This reproduces the canonical Uniswap V2 pair creation bytecode/hash.
      optimizer: { enabled: true, runs: 999999 },
    },
  },
  {
    version: "0.6.6",
    settings: {
      optimizer: { enabled: true, runs: 999999 },
    },
  },
  {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
];

export default defineConfig({
  plugins: [hardhatEthers, hardhatIgnitionEthers],
  solidity: {
    profiles: {
      default: { compilers },
      production: { compilers },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});

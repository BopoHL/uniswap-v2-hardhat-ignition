import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const copies = [
  ["@uniswap/v2-core/contracts/UniswapV2ERC20.sol", "vendor/uniswap-v2/core/contracts/UniswapV2ERC20.sol"],
  ["@uniswap/v2-core/contracts/UniswapV2Factory.sol", "vendor/uniswap-v2/core/contracts/UniswapV2Factory.sol"],
  ["@uniswap/v2-core/contracts/UniswapV2Pair.sol", "vendor/uniswap-v2/core/contracts/UniswapV2Pair.sol"],
  ["@uniswap/v2-core/contracts/interfaces/IERC20.sol", "vendor/uniswap-v2/core/contracts/interfaces/IERC20.sol"],
  ["@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol", "vendor/uniswap-v2/core/contracts/interfaces/IUniswapV2Callee.sol"],
  ["@uniswap/v2-core/contracts/interfaces/IUniswapV2ERC20.sol", "vendor/uniswap-v2/core/contracts/interfaces/IUniswapV2ERC20.sol"],
  ["@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol", "vendor/uniswap-v2/core/contracts/interfaces/IUniswapV2Factory.sol"],
  ["@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol", "vendor/uniswap-v2/core/contracts/interfaces/IUniswapV2Pair.sol"],
  ["@uniswap/v2-core/contracts/libraries/Math.sol", "vendor/uniswap-v2/core/contracts/libraries/Math.sol"],
  ["@uniswap/v2-core/contracts/libraries/SafeMath.sol", "vendor/uniswap-v2/core/contracts/libraries/SafeMath.sol"],
  ["@uniswap/v2-core/contracts/libraries/UQ112x112.sol", "vendor/uniswap-v2/core/contracts/libraries/UQ112x112.sol"],
  ["@uniswap/v2-periphery/contracts/UniswapV2Router02.sol", "vendor/uniswap-v2/periphery/contracts/UniswapV2Router02.sol"],
  ["@uniswap/v2-periphery/contracts/interfaces/IERC20.sol", "vendor/uniswap-v2/periphery/contracts/interfaces/IERC20.sol"],
  ["@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol", "vendor/uniswap-v2/periphery/contracts/interfaces/IUniswapV2Router01.sol"],
  ["@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol", "vendor/uniswap-v2/periphery/contracts/interfaces/IUniswapV2Router02.sol"],
  ["@uniswap/v2-periphery/contracts/interfaces/IWETH.sol", "vendor/uniswap-v2/periphery/contracts/interfaces/IWETH.sol"],
  ["@uniswap/v2-periphery/contracts/libraries/SafeMath.sol", "vendor/uniswap-v2/periphery/contracts/libraries/SafeMath.sol"],
  ["@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol", "vendor/uniswap-v2/periphery/contracts/libraries/UniswapV2Library.sol"],
  ["@uniswap/v2-periphery/contracts/test/WETH9.sol", "vendor/uniswap-v2/periphery/contracts/test/WETH9.sol"],
  ["@uniswap/lib/contracts/libraries/TransferHelper.sol", "vendor/uniswap-v2/lib/contracts/libraries/TransferHelper.sol"],
  ["@uniswap/v2-core/LICENSE", "vendor/uniswap-v2/LICENSE"],
];

function normalizeFinalNewline(file) {
  return file.toString("utf8").replace(/\r\n/g, "\n").replace(/\n$/, "");
}

for (const [packagePath, vendoredPath] of copies) {
  const installedPath = new URL(`../node_modules/${packagePath}`, import.meta.url);
  const committedPath = new URL(`../${vendoredPath}`, import.meta.url);
  const [installed, committed] = await Promise.all([
    readFile(installedPath),
    readFile(committedPath),
  ]);

  assert.equal(
    normalizeFinalNewline(committed),
    normalizeFinalNewline(installed),
    `${vendoredPath} differs from the installed ${packagePath}`,
  );
}

console.log(`Verified ${copies.length} vendored Uniswap files.`);

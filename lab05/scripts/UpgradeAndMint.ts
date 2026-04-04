import { network } from "hardhat";
import { parseUnits, getContract } from "viem";

// 你的 Proxy 地址（不會變）
const TOKEN_PROXY_ADDR = "0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d";
// StakeForNFT 合約
const STAKE_FOR_NFT_ADDR = "0xa73caE55DF45E8902c5A9df832D1705d6232f61E";

// ⬇️ 部署 V2 後把地址填在這裡
const IMPL_V2_ADDR = "填入V2的implementation地址";

const amt = (n: number) => parseUnits(String(n), 18);

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();
  const deployerWallet = wallets[0];

  console.log("Deployer:", deployerWallet.account.address);

  // 透過 Proxy 呼叫 V1 的 upgradeToAndCall，把 implementation 指向 V2
  const token = await viem.getContractAt("TokenLab05", TOKEN_PROXY_ADDR);

  console.log("\n=== 1. Upgrading to V2 ===");
  const upgradeTx = await token.write.upgradeToAndCall(
    [IMPL_V2_ADDR, "0x"],  // "0x" = 升級後不額外呼叫任何函式
    { account: deployerWallet.account },
  );
  console.log(`Upgrade tx: ${upgradeTx}`);
  await publicClient.waitForTransactionReceipt({ hash: upgradeTx });

  // 現在 Proxy 已經指向 V2，可以用 V2 的 ABI 操作
  const tokenV2 = await viem.getContractAt("TokenLab05V2", TOKEN_PROXY_ADDR);

  // 先查一下 StakeForNFT 持有多少代幣
  const balance = await tokenV2.read.balanceOf([STAKE_FOR_NFT_ADDR]);
  console.log(`\nStakeForNFT balance: ${balance}`);

  console.log("\n=== 2. Burning tokens from StakeForNFT ===");
  const burnTx = await tokenV2.write.burnFrom(
    [STAKE_FOR_NFT_ADDR, balance],
    { account: deployerWallet.account },
  );
  console.log(`Burn tx: ${burnTx}`);
  await publicClient.waitForTransactionReceipt({ hash: burnTx });

  // 確認餘額為 0
  const newBalance = await tokenV2.read.balanceOf([STAKE_FOR_NFT_ADDR]);
  console.log(`StakeForNFT balance after burn: ${newBalance}`);

  // Mint NFT
  console.log("\n=== 3. Minting NFT ===");
  const stakeForNFTAbi = [
    {
      name: "mint",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
  ] as const;

  const stakeForNFT = getContract({
    address: STAKE_FOR_NFT_ADDR,
    abi: stakeForNFTAbi,
    client: { public: publicClient, wallet: deployerWallet },
  });

  const mintTx = await stakeForNFT.write.mint();
  console.log(`Mint tx: ${mintTx}`);
  await publicClient.waitForTransactionReceipt({ hash: mintTx });

  console.log("\n🎉 NFT Minted! Done!");
}

main().catch(console.error);

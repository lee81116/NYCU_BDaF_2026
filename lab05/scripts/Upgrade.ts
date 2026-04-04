import { network } from "hardhat";
import { parseUnits, getContract } from "viem";

const TOKEN_LB5_V2_ADDR = "0x24Ef7ffBe4B4633b7a94BcC2e4703143622155a4";
const TOKEN_PROXY_ADDR = "0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d";
const STAKE_FOR_NFT_ADDR = "0xa73caE55DF45E8902c5A9df832D1705d6232f61E";

const amt = (n: number) => parseUnits(String(n), 18);

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();

  const deployerWallet = wallets[0]; // OWNER_PRIVATE_KEY

  if (!deployerWallet) {
    console.error("❌ OWNER_PRIVATE_KEY not found in .env!");
    process.exit(1);
  }

  console.log("=== Accounts ===");
  console.log(`Deployer: ${deployerWallet.account.address}`);

  const token = await viem.getContractAt("TokenLab05", TOKEN_PROXY_ADDR);

  console.log("\n=== Upgrading to V2 ===");
  const upgradeTx = await token.write.upgradeToAndCall(
    [TOKEN_LB5_V2_ADDR, "0x"],
    { account: deployerWallet.account },
  );
  console.log(`Upgrade tx: ${upgradeTx}`);
  await publicClient.waitForTransactionReceipt({ hash: upgradeTx });

  console.log("\n✅ Done!");
}

main().catch(console.error);

import { network } from "hardhat";
import { parseUnits, getContract } from "viem";

const TOKEN_LB5_ADDR = "0x1e30A2db9a88b3D50E0C42Ef57a8d60a0c2A26C3";
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

  // StakeForNFT ABI
  const stakeForNFTAbi = [
    {
      name: "stake",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "studentId", type: "string" },
      ],
      outputs: [],
    },
    {
      name: "unstake",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
    {
      name: "mint",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [],
      outputs: [],
    },
  ] as const;

  const token = await viem.getContractAt("TokenLab05", TOKEN_PROXY_ADDR);

  const stakeForNFT = getContract({
    address: STAKE_FOR_NFT_ADDR,
    abi: stakeForNFTAbi,
    client: { public: publicClient, wallet: deployerWallet },
  });

  // 1. Approve StakeForNFT 花費你的代幣
  console.log("\n=== 1. Approving StakeForNFT ===");
  const approveTx = await token.write.approve(
    [STAKE_FOR_NFT_ADDR, amt(10000)],
    { account: deployerWallet.account },
  );
  console.log(`Approve tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // 2. Stake
  console.log("\n=== 2. Staking ===");
  const stakeTx = await stakeForNFT.write.stake(
    [TOKEN_PROXY_ADDR, amt(10000), "314554045"],
  );
  console.log(`Stake tx: ${stakeTx}`);
  await publicClient.waitForTransactionReceipt({ hash: stakeTx });

  console.log("\n✅ Done!");
}

main().catch(console.error);

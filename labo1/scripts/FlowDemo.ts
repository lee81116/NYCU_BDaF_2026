import { network } from "hardhat";
import { parseUnits, formatUnits, keccak256, encodePacked } from "viem";

const TOKEN_A_ADDR = "0xCaFB582BF6741Fab4d27aFc04c1f46Db46953780";
const TOKEN_B_ADDR = "0xdFa9ae31513a6D2A78f30299269da7d42E4F19eD";
const DEX_ADDR = "0xBB7808eb02400eCD647bAB5f8D1E36b2c3C323fC";
const ONSITE_CHECKER_ADDR = "0xa6FF20737004fb2f632B6b9388C7731B871a201D";

const amt = (n: number) => parseUnits(String(n), 18);

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();

  const deployerWallet = wallets[0]; // OWNER_PRIVATE_KEY
  const aliceWallet = wallets[1]; // ALICE_PRIVATE_KEY
  const bobWallet = wallets[2];   // BOB_PRIVATE_KEY

  if (!deployerWallet || !aliceWallet || !bobWallet) {
    console.error("❌ OWNER_PRIVATE_KEY or ALICE_PRIVATE_KEY or BOB_PRIVATE_KEY not found in .env! Add them and try again.");
    process.exit(1);
  }

  console.log("=== Accounts ===");
  console.log(`Deployer: ${deployerWallet.account.address}`);
  console.log(`Alice: ${aliceWallet.account.address}`);
  console.log(`Bob:   ${bobWallet.account.address}`);

  // Get contract instances
  const tokenA = await viem.getContractAt("TokenA", TOKEN_A_ADDR);
  const tokenB = await viem.getContractAt("TokenB", TOKEN_B_ADDR);
  const DEX = await viem.getContractAt("DEX", DEX_ADDR);

  console.log("\n=== 1. Approving DEX ===");
  const approveTxA = await tokenA.write.approve(
    [DEX_ADDR, amt(1000)],
    { account: deployerWallet.account },
  );
  console.log(`Approve TokenA tx: ${approveTxA}`);

  const approveTxB = await tokenB.write.approve(
    [DEX_ADDR, amt(1000)],
    { account: deployerWallet.account },
  );
  console.log(`Approve TokenB tx: ${approveTxB}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTxB });

  console.log("\n=== 2. Adding Liquidity ===");
  // amountA = 100, amountB = 50 
  const addLiquidityTx = await DEX.write.addLiquidity(
    [amt(100), amt(50)],
    { account: deployerWallet.account },
  );
  console.log(`Add Liquidity tx: ${addLiquidityTx}`);
  await publicClient.waitForTransactionReceipt({ hash: addLiquidityTx });

  const transferTxA = await tokenA.write.transfer(
    [ONSITE_CHECKER_ADDR, amt(10000)],
    { account: deployerWallet.account },
  );
  console.log(`Transfer TokenA to OnsiteChecker tx: ${transferTxA}`);
  await publicClient.waitForTransactionReceipt({ hash: transferTxA });

  const transferTxB = await tokenB.write.transfer(
    [ONSITE_CHECKER_ADDR, amt(10000)],
    { account: deployerWallet.account },
  );
  console.log(`Transfer TokenB to OnsiteChecker tx: ${transferTxB}`);
  await publicClient.waitForTransactionReceipt({ hash: transferTxB });

  // 4. Call OnSiteChecker
  console.log("\n=== 4. Calling OnSiteChecker ===");
  
  // Define the ABI manually since it's an external contract
  const onsiteCheckerAbi = [
    { "inputs":[{"internalType":"address","name":"_feeRecipient","type":"address"}],
      "stateMutability":"nonpayable","type":"constructor"},
    { "anonymous":false,
      "inputs":[{"indexed":false,"internalType":"string","name":"studentId","type":"string"},
        {"indexed":true,"internalType":"address","name":"caller","type":"address"}],
      "name":"Passed","type":"event"},
    { "anonymous":false,
      "inputs":[{"indexed":false,"internalType":"string","name":"studentId","type":"string"},
        {"indexed":true,"internalType":"address","name":"caller","type":"address"}],
      "name":"PassedBonus","type":"event"},
    { "inputs":[{"internalType":"address","name":"","type":"address"}],
      "name":"callerUsed","outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view","type":"function"},
    { "inputs":[{"internalType":"address","name":"","type":"address"}],
      "name":"callerUsedBonus","outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view","type":"function"},
    { "inputs":[{"internalType":"string","name":"studentId","type":"string"},
      {"internalType":"address","name":"dex","type":"address"},
      {"internalType":"address","name":"tokenA","type":"address"},
      {"internalType":"address","name":"tokenB","type":"address"},
      {"internalType":"uint256","name":"rate","type":"uint256"}],
      "name":"check","outputs":[],"stateMutability":"nonpayable","type":"function"},
    { "inputs":[{"internalType":"string","name":"studentId","type":"string"},
      {"internalType":"address","name":"dex","type":"address"},
      {"internalType":"address","name":"tokenA","type":"address"},
      {"internalType":"address","name":"tokenB","type":"address"},
      {"internalType":"uint256","name":"rate","type":"uint256"}],
      "name":"checkBonus","outputs":[],"stateMutability":"nonpayable","type":"function"},
    { "inputs":[],
      "name":"feeRecipient",
      "outputs":[{"internalType":"contract FeeRecipient","name":"","type":"address"}],
      "stateMutability":"view","type":"function"},
    { "inputs":[{"internalType":"string","name":"","type":"string"}],
      "name":"passed",
      "outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view","type":"function"},
    { "inputs":[{"internalType":"string","name":"","type":"string"}],
      "name":"passedBonus",
      "outputs":[{"internalType":"bool","name":"","type":"bool"}],
      "stateMutability":"view","type":"function"}] as const;

  // 4. Call OnSiteChecker
  console.log("\n=== 4. Calling OnSiteChecker ===");

  try {
    /*const checkTx = await deployerWallet.writeContract({
      address: ONSITE_CHECKER_ADDR,
      abi: onsiteCheckerAbi,
      functionName: 'check',
      args: ["314554045", DEX_ADDR, TOKEN_A_ADDR, TOKEN_B_ADDR, 2n],
      account: deployerWallet.account
    });
    console.log(`✅ OnSiteChecker.check tx: ${checkTx}`);
    await publicClient.waitForTransactionReceipt({ hash: checkTx });*/

    const checkBonusTx = await deployerWallet.writeContract({
      address: ONSITE_CHECKER_ADDR,
      abi: onsiteCheckerAbi,
      functionName: 'checkBonus',
      args: ["314554045", DEX_ADDR, TOKEN_A_ADDR, TOKEN_B_ADDR, 2n],
      account: deployerWallet.account
    });
    console.log(`✅ OnSiteChecker.checkBonus tx: ${checkBonusTx}`);
    await publicClient.waitForTransactionReceipt({ hash: checkBonusTx });
    console.log("🏆 ALL STEPS COMPLETED AND MINED!");
  } catch (error) {
    console.error("❌ OnSiteChecker.check failed:", error);
  }
}

main().catch(console.error);

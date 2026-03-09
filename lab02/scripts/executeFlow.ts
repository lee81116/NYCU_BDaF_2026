/**
 * Lab02 Full Flow Execution Script
 *
 * Executes the complete trade flow on Zircuit Garfield Testnet:
 * 1. Owner transfers TokenA to Alice and TokenB to Bob
 * 2. Alice approves & sets up trade (selling TokenA for TokenB)
 * 3. Bob approves & settles trade
 * 4. Owner withdraws accumulated fees
 *
 * Prerequisites:
 * - .env must have OWNER_PRIVATE_KEY (Owner), ALICE_PRIVATE_KEY, and BOB_PRIVATE_KEY
 * - Owner must have Garfield testnet ETH for gas to transfer tokens
 * - Alice and Bob must have Garfield testnet ETH for gas
 * - Contracts must be deployed (TokenA, TokenB, TokenTrade)
 */

import { network } from "hardhat";
import { parseUnits, formatUnits } from "viem";

// TODO: Replace these with the new addresses after deploying
const TOKEN_A_ADDR = "0x24EFc2B61deC3549D46fFDc76077D7753D33a382";
const TOKEN_B_ADDR = "0x2831d275dADCb29F0367Ea388118bE4d2DCe93b5";
const TOKEN_TRADE_ADDR = "0x171a1454251FDFC5F5AEA9335C456Ed3e62Fe361";

const amt = (n: number) => parseUnits(String(n), 18);

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const wallets = await viem.getWalletClients();

  const owner = wallets[0]; // OWNER_PRIVATE_KEY
  const alice = wallets[1]; // ALICE_PRIVATE_KEY
  const bob = wallets[2];   // BOB_PRIVATE_KEY

  if (!alice || !bob) {
    console.error("❌ ALICE_PRIVATE_KEY or BOB_PRIVATE_KEY not found in .env! Add them and try again.");
    process.exit(1);
  }

  console.log("=== Accounts ===");
  console.log(`Owner: ${owner.account.address}`);
  console.log(`Alice: ${alice.account.address}`);
  console.log(`Bob:   ${bob.account.address}`);

  // Get contract instances
  const tokenA = await viem.getContractAt("TokenA", TOKEN_A_ADDR);
  const tokenB = await viem.getContractAt("TokenB", TOKEN_B_ADDR);
  const tokenTrade = await viem.getContractAt("TokenTrade", TOKEN_TRADE_ADDR);

  // =========================================================
  // Step 0: Transfer TokenA to Alice and TokenB to Bob
  // =========================================================
  console.log("\n--- Step 0: Transfer TokenA to Alice & TokenB to Bob ---");
  const transferTxA = await tokenA.write.transfer(
    [alice.account.address, amt(10_000)],
    { account: owner.account },
  );
  console.log(`Transfer TokenA to Alice tx: ${transferTxA}`);
  await publicClient.waitForTransactionReceipt({ hash: transferTxA });
  console.log("✅ Alice received 10,000 TokenA");

  const transferTxB = await tokenB.write.transfer(
    [bob.account.address, amt(5_000)],
    { account: owner.account },
  );
  console.log(`Transfer TokenB to Bob tx:   ${transferTxB}`);
  await publicClient.waitForTransactionReceipt({ hash: transferTxB });
  console.log("✅ Bob received 5,000 TokenB");

  // =========================================================
  // Step 1: Alice sets up trade (sell 10,000 TKA for 5,000 TKB)
  // =========================================================
  console.log("\n--- Step 1: Alice sets up trade ---");

  // Alice approves TokenTrade to spend her TokenA
  const approveTx = await tokenA.write.approve(
    [TOKEN_TRADE_ADDR, amt(10_000)],
    { account: alice.account },
  );
  console.log(`Alice approve tx: ${approveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: approveTx });

  // Alice sets up the trade — expiry 1 hour from now
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
  const setupTx = await tokenTrade.write.setupTrade(
    [TOKEN_A_ADDR, amt(10_000), amt(5_000), expiry],
    { account: alice.account },
  );
  console.log(`✅ Alice setupTrade tx: ${setupTx}`);
  await publicClient.waitForTransactionReceipt({ hash: setupTx });

  // =========================================================
  // Step 2: Bob settles trade
  // =========================================================
  console.log("\n--- Step 2: Bob settles trade ---");

  // Bob approves TokenTrade to spend his TokenB
  const bobApproveTx = await tokenB.write.approve(
    [TOKEN_TRADE_ADDR, amt(5_000)],
    { account: bob.account },
  );
  console.log(`Bob approve tx: ${bobApproveTx}`);
  await publicClient.waitForTransactionReceipt({ hash: bobApproveTx });

  // Get the latest tradeId (tradeCounter - 1)
  const tradeCounter = await tokenTrade.read.tradeCounter();
  const tradeId = tradeCounter - 1n;

  const settleTx = await tokenTrade.write.settleTrade(
    [tradeId],
    { account: bob.account },
  );
  console.log(`✅ Bob settleTrade tx: ${settleTx}`);
  await publicClient.waitForTransactionReceipt({ hash: settleTx });

  // =========================================================
  // Step 3: Owner withdraws fee
  // =========================================================
  console.log("\n--- Step 3: Owner withdraws fee ---");

  const feeA = await tokenTrade.read.tokenAFeeBalance();
  const feeB = await tokenTrade.read.tokenBFeeBalance();
  console.log(`Fee balances — TokenA: ${formatUnits(feeA, 18)}, TokenB: ${formatUnits(feeB, 18)}`);

  const withdrawTx = await tokenTrade.write.withdrawFee({
    account: owner.account,
  });
  console.log(`✅ Owner withdrawFee tx: ${withdrawTx}`);
  await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

  // =========================================================
  // Summary
  // =========================================================
  console.log("\n========================================");
  console.log("🎉 Full flow complete! Transaction Hashes:");
  console.log("========================================");
  console.log(`Alice setupTrade:    ${setupTx}`);
  console.log(`Bob settleTrade:     ${settleTx}`);
  console.log(`Owner withdrawFee:   ${withdrawTx}`);
  console.log("========================================");
}

main().catch(console.error);

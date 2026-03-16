import { network } from "hardhat";
import { parseUnits, formatUnits, keccak256, encodePacked } from "viem";

const TOKEN_TLS_ADDR = "0xF269871a76Fda36DB632bDD1Db519e9822F3FFb3";

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
  const tokenTLS = await viem.getContractAt("TokenTLS", TOKEN_TLS_ADDR);

  // =========================================================
  // Step 1: Alice receive tokens
  // =========================================================
  console.log("\n--- Step 1: Alice receive tokens ---");
  const transferAliceTx = await tokenTLS.write.transfer(
    [aliceWallet.account.address, amt(10_000)],
    { account: deployerWallet.account },
  );
  console.log(`Transfer TokenTLS to Alice tx: ${transferAliceTx}`);
  await publicClient.waitForTransactionReceipt({ hash: transferAliceTx });
  console.log("✅ Alice received 10,000 TokenTLS");

  // =========================================================
  // Step 2: Alice sign an approval meassage for Bob off chain
  // =========================================================
  console.log("\n--- Step 2: Alice sign an approval meassage for Bob off chain ---");
  const owner = aliceWallet.account.address;
  const spender = bobWallet.account.address;
  const value = amt(1000);
  const nonce = await tokenTLS.read.nonces([owner]);
  const deadline = BigInt(Math.floor(Date.now()/1000) + 3600);
  
  const hash = keccak256(encodePacked(
    ["address", "address", "uint256", "uint256", "uint256", "address"],
    [owner, spender, value, nonce, deadline, tokenTLS.address]
  ));
  const signature = await aliceWallet.signMessage({
    message: { raw: hash }
  });
  console.log(`Alice signature: ${signature}`);
  // =========================================================
  // Step 3: Bob submits permit() using Alice's signature
  // =========================================================
  console.log("\n--- Step 3: Bob submits permit() using Alice's signature ---");
  const permitTx = await tokenTLS.write.permit(
    [owner, spender, value, nonce, deadline, signature],
    {account: bobWallet.account}
  );
  console.log("Permit tx: ", permitTx);
  await publicClient.waitForTransactionReceipt({hash: permitTx});
  console.log("✅ Bob permit() successfully");
  // =========================================================
  // Step 4: Bob calls transferFrom() to transfer tokens from Alice
  // =========================================================
  console.log("\n--- Step 4: Bob calls transferFrom() to transfer tokens from Alice ---");

  const transferBobTx = await tokenTLS.write.transferFrom(
    [aliceWallet.account.address, bobWallet.account.address, amt(1000)],
    {account: bobWallet.account}
  );
  console.log("TransferFrom tx: ", transferBobTx);
  await publicClient.waitForTransactionReceipt({hash: transferBobTx});
  console.log("✅ Bob transferFrom() successfully");

  // =========================================================
  // Summary
  // =========================================================
  console.log("\n========================================");
  console.log("🎉 Full flow complete! Transaction Hashes:");
  console.log("========================================");
  console.log(`Alice receive:    ${transferAliceTx}`);
  console.log(`Bob permit:     ${permitTx}`);
  console.log(`Bob transferFrom:   ${transferBobTx}`);
  console.log("========================================");
}

main().catch(console.error);

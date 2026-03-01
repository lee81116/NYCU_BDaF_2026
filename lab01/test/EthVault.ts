import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseEther, type Address, getAddress } from "viem";

describe("EthVault", async function () {
  let publicClient: any;
  let ownerWallet: any;
  let otherWallet: any;
  // Make viem available to entire block
  const { viem } = await network.connect();

  beforeEach(async function () {
    publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();
    ownerWallet = walletClients[0]; // This is the deployer/owner
    otherWallet = walletClients[1]; // This is a random tester
  });

  // ========== Test Group A — Deposits ==========
  describe("Group A - Deposits", function () {
    it("Should accept ETH and increase balance...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1")})
      const balance = await publicClient.getBalance({address: vault.address})

      assert.equal(balance, parseEther("1"));
    });

    it("Should emit Deposit event...", async function () {
      const vault = await viem.deployContract("EthVault");
      
      // Get the transaction receipt and check its logs
      const tx = await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1")})
      const receipt = await publicClient.getTransactionReceipt({hash: tx})
      const decodedLogs = await publicClient.getContractEvents({
        address: vault.address,
        abi: vault.abi,
        eventName: 'Deposit'
      })

      assert.equal(decodedLogs.length, 1)
      assert.equal(decodedLogs[0].eventName, "Deposit")
      assert.equal(decodedLogs[0].args.sender?.toLowerCase(), ownerWallet.account.address.toLowerCase())
      assert.equal(decodedLogs[0].args.amount, parseEther("1"))
    });
    
    it("Should accept multiple deposits...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1")})
      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("2")})
      const balance = await publicClient.getBalance({address: vault.address})

      assert.equal(balance, parseEther("3"))
    })

    it("Should accept different senders...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1")})
      await otherWallet.sendTransaction({ to: vault.address, value: parseEther("2")})
      const balance = await publicClient.getBalance({address: vault.address})

      assert.equal(balance, parseEther("3"))
    })
  });

  // ========== Test Group B — Owner Withdrawal ==========
  describe("Group B - Owner Withdrawal", function () {
    it("Owner can withdraw full balance...", async function () {
       const vault = await viem.deployContract("EthVault");

       await ownerWallet.sendTransaction({ to:vault.address, value: parseEther("5")})
       await vault.write.withdraw([parseEther("5")])

       assert.equal(await publicClient.getBalance({address: vault.address}), parseEther("0"))
    });
    
    // TODO: Add the other Group B tests (Withdraw partial amount, Emit Withdraw event)
    it("Owner can withdraw partial balance...", async function () {
       const vault = await viem.deployContract("EthVault");

       await ownerWallet.sendTransaction({ to:vault.address, value: parseEther("5")})
       await vault.write.withdraw([parseEther("2")])

       assert.equal(await publicClient.getBalance({address: vault.address}), parseEther("3"))
    });

    it("Should emit Withdraw event...", async function (){
        const vault = await viem.deployContract("EthVault");

        await ownerWallet.sendTransaction({ to:vault.address, value: parseEther("5")})
        
        await viem.assertions.emitWithArgs(vault.write.withdraw([parseEther("2")]),
            vault,
            "Weethdraw",
            [getAddress(ownerWallet.account.address), parseEther("2")]
        )
    })
  });

  // ========== Test Group C — Unauthorized Withdrawal ==========
  describe("Group C - Unauthorized Withdrawal", function () {
    it("Non-owner cannot withdraw funds / Contract balance unchanged...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1") });
      await vault.write.withdraw([parseEther("1")], { account: otherWallet.account });

      assert.equal(await publicClient.getBalance({address: vault.address}), parseEther("1"));
    })

    it("Unauthorized withdrawal event emitted...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1") });
      await vault.write.withdraw([parseEther("1")], { account: otherWallet.account });

      await viem.assertions.emitWithArgs(vault.write.withdraw([parseEther("1")], { account: otherWallet.account }),
        vault,
        "UnauthorizedWithdrawAttempt",
        [getAddress(otherWallet.account.address), parseEther("1")]
      )
    })

    it("Function does not revert...", async function () {
       const vault = await viem.deployContract("EthVault");
       
       await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1") });   
       await vault.write.withdraw([parseEther("1")],{account: otherWallet.account})
       // If it doesn't throw, it did not revert!
       assert.ok(true);
    });
  });

  // ========== Test Group D — Edge Cases ==========
  describe("Group D - Edge Cases", function () {
    it("Withdraw more than balance -> revert...", async function () {
       const vault = await viem.deployContract("EthVault");
       
       await assert.rejects(vault.write.withdraw([parseEther("1")]))
    });
    
    it("Withdraw zero -> emit event...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1") });

      await viem.assertions.emitWithArgs(vault.write.withdraw([parseEther("0")]),
        vault,
        "Weethdraw",
        [getAddress(ownerWallet.account.address), parseEther("0")]
      )
    })

    it("Contract handles multiple deposits before withdrawal...", async function () {
      const vault = await viem.deployContract("EthVault");

      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("1") });
      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("2") });
      await ownerWallet.sendTransaction({ to: vault.address, value: parseEther("3") });
      assert.equal(await publicClient.getBalance({address:vault.address}), parseEther("6"))

      await vault.write.withdraw([parseEther("6")]);
      assert.equal(await publicClient.getBalance({address: vault.address}), parseEther("0"));
    })
  });
});

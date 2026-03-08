import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits, getAddress } from "viem";

describe("TokenTrade", async function () {
  const { viem } = await network.connect();
  let publicClient: any;
  let ownerWallet: any;
  let aliceWallet: any;
  let bobWallet: any;

  let tokenA: any;
  let tokenB: any;
  let tokenTrade: any;

  const DECIMALS = 18;
  const amt = (n: number) => parseUnits(String(n), DECIMALS);

  beforeEach(async function () {
    publicClient = await viem.getPublicClient();
    const wallets = await viem.getWalletClients();
    ownerWallet = wallets[0]; // deployer / protocol owner
    aliceWallet = wallets[1]; // seller
    bobWallet = wallets[2];   // buyer

    // Deploy tokens — owner gets full supply
    tokenA = await viem.deployContract("TokenA");
    tokenB = await viem.deployContract("TokenB");

    // Deploy TokenTrade
    tokenTrade = await viem.deployContract("TokenTrade", [
      tokenA.address,
      tokenB.address,
    ]);

    // Distribute tokens: give Alice some TokenA, give Bob some TokenB
    await tokenA.write.transfer([aliceWallet.account.address, amt(100_000)]);
    await tokenB.write.transfer([bobWallet.account.address, amt(100_000)]);
  });

  // ========== Deployment ==========
  describe("Deployment", function () {
    it("Should set the correct owner...", async function () {
      const contractOwner = await tokenTrade.read.owner();
      assert.equal(
        getAddress(contractOwner),
        getAddress(ownerWallet.account.address),
      );
    });

    it("Should set the correct tokenA and tokenB addresses...", async function () {
      const contractTokenA = await tokenTrade.read.tokenA();
      const contractTokenB = await tokenTrade.read.tokenB();
      assert.equal(getAddress(contractTokenA), getAddress(tokenA.address));
      assert.equal(getAddress(contractTokenB), getAddress(tokenB.address));
    });

    it("Should start with tradeCounter = 0...", async function () {
      assert.equal(await tokenTrade.read.tradeCounter(), 0n);
    });
  });

  // ========== setupTrade ==========
  describe("setupTrade", function () {
    it("Should create a trade and escrow tokens successfully...", async function () {
      // Alice approves and sets up a trade: selling 10,000 TokenA, asking 5,000 TokenB
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });

      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );

      // Verify trade counter incremented
      assert.equal(await tokenTrade.read.tradeCounter(), 1n);

      // Verify tokens were escrowed
      const escrowBalance = await tokenA.read.balanceOf([tokenTrade.address]);
      assert.equal(escrowBalance, amt(10_000));
    });

    it("Should emit TradeSetup event...", async function () {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);

      const txHash = await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );
      await publicClient.getTransactionReceipt({ hash: txHash });

      const events = await publicClient.getContractEvents({
        address: tokenTrade.address,
        abi: tokenTrade.abi,
        eventName: "TradeSetup",
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.tradeId, 0n);
      assert.equal(
        getAddress(events[0].args.seller),
        getAddress(aliceWallet.account.address),
      );
      assert.equal(events[0].args.inputAmount, amt(10_000));
    });

    it("Should auto-determine askToken as tokenB when selling tokenA...", async function () {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );

      const trade = await tokenTrade.read.trades([0n]);
      // trade tuple: [seller, inputToken, inputAmount, askToken, askAmount, expiry, isCompleted]
      assert.equal(getAddress(trade[3]), getAddress(tokenB.address));
    });

    it("Should revert if inputTokenAmount is 0...", async function () {
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await assert.rejects(
        tokenTrade.write.setupTrade(
          [tokenA.address, 0n, amt(5_000), futureExpiry],
          { account: aliceWallet.account },
        ),
      );
    });

    it("Should revert if outputTokenAsk is 0...", async function () {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await assert.rejects(
        tokenTrade.write.setupTrade(
          [tokenA.address, amt(10_000), 0n, futureExpiry],
          { account: aliceWallet.account },
        ),
      );
    });

    it("Should revert if expiry is in the past...", async function () {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const pastExpiry = BigInt(Math.floor(Date.now() / 1000) - 3600);
      await assert.rejects(
        tokenTrade.write.setupTrade(
          [tokenA.address, amt(10_000), amt(5_000), pastExpiry],
          { account: aliceWallet.account },
        ),
      );
    });

    it("Should revert if inputToken is not tokenA or tokenB...", async function () {
      const fakeTokenAddr = "0x0000000000000000000000000000000000000001";
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await assert.rejects(
        tokenTrade.write.setupTrade(
          [fakeTokenAddr, amt(10_000), amt(5_000), futureExpiry],
          { account: aliceWallet.account },
        ),
      );
    });

    it("Should revert if inputTokenAmount < 1000 (fee minimum)...", async function () {
      await tokenA.write.approve([tokenTrade.address, 999n], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await assert.rejects(
        tokenTrade.write.setupTrade(
          [tokenA.address, 999n, amt(5_000), futureExpiry],
          { account: aliceWallet.account },
        ),
      );
    });
  });

  // ========== settleTrade ==========
  describe("settleTrade", function () {
    // Helper: Alice sets up a trade selling 10,000 TKA for 5,000 TKB
    async function setupAliceTrade() {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );
    }

    it("Should settle a trade: buyer pays seller, buyer receives tokens minus fee...", async function () {
      await setupAliceTrade();

      // Bob approves TokenB to pay Alice
      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: bobWallet.account,
      });

      const aliceTokenBBefore = await tokenB.read.balanceOf([
        aliceWallet.account.address,
      ]);

      await tokenTrade.write.settleTrade([0n], {
        account: bobWallet.account,
      });

      // Alice received 5,000 TKB
      const aliceTokenBAfter = await tokenB.read.balanceOf([
        aliceWallet.account.address,
      ]);
      assert.equal(aliceTokenBAfter - aliceTokenBBefore, amt(5_000));

      // Bob received 10,000 TKA minus 0.1% fee = 9,990 TKA
      const feeAmount = amt(10_000) / 1000n;
      const buyerAmount = amt(10_000) - feeAmount;
      const bobTokenABalance = await tokenA.read.balanceOf([
        bobWallet.account.address,
      ]);
      assert.equal(bobTokenABalance, buyerAmount);

      // Fee accumulated in contract
      const feeBalance = await tokenTrade.read.tokenAFeeBalance();
      assert.equal(feeBalance, feeAmount);
    });

    it("Should emit TradeSettled event...", async function () {
      await setupAliceTrade();
      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: bobWallet.account,
      });

      const txHash = await tokenTrade.write.settleTrade([0n], {
        account: bobWallet.account,
      });
      await publicClient.getTransactionReceipt({ hash: txHash });

      const events = await publicClient.getContractEvents({
        address: tokenTrade.address,
        abi: tokenTrade.abi,
        eventName: "TradeSettled",
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.tradeId, 0n);
      assert.equal(
        getAddress(events[0].args.buyer),
        getAddress(bobWallet.account.address),
      );
    });

    it("Should mark the trade as completed...", async function () {
      await setupAliceTrade();
      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: bobWallet.account,
      });
      await tokenTrade.write.settleTrade([0n], {
        account: bobWallet.account,
      });

      const trade = await tokenTrade.read.trades([0n]);
      // trade tuple index 6 = isCompleted
      assert.equal(trade[6], true);
    });

    it("Should revert on invalid trade ID...", async function () {
      await assert.rejects(
        tokenTrade.write.settleTrade([999n], {
          account: bobWallet.account,
        }),
      );
    });

    it("Should revert if trade is already completed...", async function () {
      await setupAliceTrade();
      await tokenB.write.approve([tokenTrade.address, amt(10_000)], {
        account: bobWallet.account,
      });
      await tokenTrade.write.settleTrade([0n], {
        account: bobWallet.account,
      });

      // Try to settle again
      await assert.rejects(
        tokenTrade.write.settleTrade([0n], {
          account: bobWallet.account,
        }),
      );
    });

    it("Should revert if trade is expired...", async function () {
      // Setup trade with a very short expiry
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      // Use a timestamp just barely in the future so it expires quickly
      const latestBlock = await publicClient.getBlock();
      const nearExpiry = latestBlock.timestamp + 2n;
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), nearExpiry],
        { account: aliceWallet.account },
      );

      // Mine blocks to advance time past the expiry
      await publicClient.request({
        method: "evm_increaseTime" as any,
        params: [10],
      });
      await publicClient.request({
        method: "evm_mine" as any,
      });

      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: bobWallet.account,
      });

      await assert.rejects(
        tokenTrade.write.settleTrade([0n], {
          account: bobWallet.account,
        }),
      );
    });

    it("Should revert if seller tries to settle their own trade...", async function () {
      await setupAliceTrade();
      // Alice (the seller) tries to settle her own trade
      await tokenB.write.transfer(
        [aliceWallet.account.address, amt(5_000)],
        { account: bobWallet.account },
      );
      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: aliceWallet.account,
      });

      await assert.rejects(
        tokenTrade.write.settleTrade([0n], {
          account: aliceWallet.account,
        }),
      );
    });
  });

  // ========== cancelTrade ==========
  describe("cancelTrade", function () {
    async function setupAliceTrade() {
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );
    }

    it("Should allow seller to cancel and recover escrowed tokens...", async function () {
      await setupAliceTrade();

      const aliceBalanceBefore = await tokenA.read.balanceOf([
        aliceWallet.account.address,
      ]);

      await tokenTrade.write.cancelTrade([0n], {
        account: aliceWallet.account,
      });

      const aliceBalanceAfter = await tokenA.read.balanceOf([
        aliceWallet.account.address,
      ]);
      assert.equal(aliceBalanceAfter - aliceBalanceBefore, amt(10_000));

      // Contract escrow should be empty
      const escrowBalance = await tokenA.read.balanceOf([tokenTrade.address]);
      assert.equal(escrowBalance, 0n);
    });

    it("Should emit TradeCancelled event...", async function () {
      await setupAliceTrade();

      const txHash = await tokenTrade.write.cancelTrade([0n], {
        account: aliceWallet.account,
      });
      await publicClient.getTransactionReceipt({ hash: txHash });

      const events = await publicClient.getContractEvents({
        address: tokenTrade.address,
        abi: tokenTrade.abi,
        eventName: "TradeCancelled",
      });

      assert.equal(events.length, 1);
      assert.equal(events[0].args.tradeId, 0n);
    });

    it("Should mark trade as completed after cancellation...", async function () {
      await setupAliceTrade();
      await tokenTrade.write.cancelTrade([0n], {
        account: aliceWallet.account,
      });
      const trade = await tokenTrade.read.trades([0n]);
      assert.equal(trade[6], true); // isCompleted
    });

    it("Should revert if non-seller tries to cancel...", async function () {
      await setupAliceTrade();
      await assert.rejects(
        tokenTrade.write.cancelTrade([0n], {
          account: bobWallet.account,
        }),
      );
    });

    it("Should revert if trade is already completed...", async function () {
      await setupAliceTrade();
      await tokenTrade.write.cancelTrade([0n], {
        account: aliceWallet.account,
      });
      // Try to cancel again
      await assert.rejects(
        tokenTrade.write.cancelTrade([0n], {
          account: aliceWallet.account,
        }),
      );
    });
  });

  // ========== withdrawFee ==========
  describe("withdrawFee", function () {
    async function setupAndSettleTrade() {
      // Alice sells 10,000 TKA for 5,000 TKB
      await tokenA.write.approve([tokenTrade.address, amt(10_000)], {
        account: aliceWallet.account,
      });
      const futureExpiry = BigInt(Math.floor(Date.now() / 1000) + 3600);
      await tokenTrade.write.setupTrade(
        [tokenA.address, amt(10_000), amt(5_000), futureExpiry],
        { account: aliceWallet.account },
      );

      // Bob settles the trade
      await tokenB.write.approve([tokenTrade.address, amt(5_000)], {
        account: bobWallet.account,
      });
      await tokenTrade.write.settleTrade([0n], {
        account: bobWallet.account,
      });
    }

    it("Should allow owner to withdraw accumulated fees...", async function () {
      await setupAndSettleTrade();

      const expectedFee = amt(10_000) / 1000n; // 0.1% of 10,000
      assert.equal(await tokenTrade.read.tokenAFeeBalance(), expectedFee);

      const ownerBalanceBefore = await tokenA.read.balanceOf([
        ownerWallet.account.address,
      ]);

      await tokenTrade.write.withdrawFee();

      const ownerBalanceAfter = await tokenA.read.balanceOf([
        ownerWallet.account.address,
      ]);
      assert.equal(ownerBalanceAfter - ownerBalanceBefore, expectedFee);

      // Fee balances should be reset to 0
      assert.equal(await tokenTrade.read.tokenAFeeBalance(), 0n);
      assert.equal(await tokenTrade.read.tokenBFeeBalance(), 0n);
    });

    it("Should revert if non-owner tries to withdraw fees...", async function () {
      await setupAndSettleTrade();
      await assert.rejects(
        tokenTrade.write.withdrawFee({ account: aliceWallet.account }),
      );
    });

    it("Should succeed even when only one token has accumulated fees...", async function () {
      await setupAndSettleTrade();
      // Only tokenA fees exist, tokenB fees = 0
      // This should still succeed (the contract simply skips the zero-balance transfer)
      await tokenTrade.write.withdrawFee();

      assert.equal(await tokenTrade.read.tokenAFeeBalance(), 0n);
      assert.equal(await tokenTrade.read.tokenBFeeBalance(), 0n);
    });
  });
});

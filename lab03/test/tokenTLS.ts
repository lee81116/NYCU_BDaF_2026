import assert from "node:assert/strict";
import { describe, it, beforeEach} from "node:test";
import { network } from "hardhat";
import {parseUnits, keccak256, encodePacked} from "viem";

describe("TokenTLS", async function () {
    let publicClient: any;
    let aliceWallet: any;
    let bobWallet: any;

    let tokenTLS: any;

    const DECIMALS = 18;
    const amt = (n: number) => parseUnits(String(n), DECIMALS)

    beforeEach(async function (){
        const {viem} = await network.connect();
        publicClient = await viem.getPublicClient();
        const wallets = await viem.getWalletClients();
        aliceWallet = wallets[0];
        bobWallet = wallets[1];
        
        // deploy with wallet[0] in default
        tokenTLS = await viem.deployContract("TokenTLS");
    })

    // ========== Pre-setup ==========
    describe("Pre-setup", function (){
        it("Alice should have all tokens after deployment...", async function (){
            const aliceBalance = await tokenTLS.read.balanceOf([aliceWallet.account.address]);
            assert.equal(aliceBalance, amt(100_000_000));
        })
    })

    // ========== Signature Verification ==========
    describe("Signature Verification", function (){
        it("Valid signature should successfully execute permit...", async function (){
            const owner = aliceWallet.account.address;
            const spender = bobWallet.account.address;
            const value = amt(1000);
            const nonce = await tokenTLS.read.nonces([owner]);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

            const hash = keccak256(encodePacked(
                ["address", "address", "uint256", "uint256", "uint256", "address"],
                [owner, spender, value, nonce, deadline, tokenTLS.address]
            ));
            const signature = await aliceWallet.signMessage({
                message: { raw: hash }
            });
            await tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature]);

        })
        it("Signature from wrong signer should fail...", async function (){
            const owner = aliceWallet.account.address;
            const spender = bobWallet.account.address;
            const value = amt(1000);
            const nonce = await tokenTLS.read.nonces([owner]);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

            const hash = keccak256(encodePacked(
                ["address", "address", "uint256", "uint256", "uint256", "address"],
                [owner, spender, value, nonce, deadline, tokenTLS.address]
            ));
            const wrongSignature = await bobWallet.signMessage({
                message: { raw: hash }
            });
            await assert.rejects(
                tokenTLS.write.permit([
                    owner, spender, value, nonce, deadline, wrongSignature
                ])
            );
        })
    })
    // ========== Nonce Protection ==========
    describe("Nonce Protection", async function (){
        it("Nonce should increase after successful permit...", async function (){
            const owner = aliceWallet.account.address;
            const spender = bobWallet.account.address;
            const value = amt(1000);
            const nonce = await tokenTLS.read.nonces([owner]);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

            const hash = keccak256(encodePacked(
                ["address", "address", "uint256", "uint256", "uint256", "address"],
                [owner, spender, value, nonce, deadline, tokenTLS.address]
            ));
            const signature = await aliceWallet.signMessage({
                message: { raw: hash }
            });
            await tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature]);
            const newNonce = await tokenTLS.read.nonces([owner]);
            assert.equal(newNonce, nonce + 1n);
        })
        it("Reusing the same signature should fail...", async function (){
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
            await tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature]);
            await assert.rejects(
                tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature])
            )
        })
    })
    // ========== Expiry ==========
    describe("Expiry", async function(){
        it("Expired signature should fail...", async function(){
            const owner = aliceWallet.account.address;
            const spender = bobWallet.account.address;
            const value = amt(1000);
            const nonce = await tokenTLS.read.nonces([owner]);
            const deadline = BigInt(Math.floor(Date.now()/1000) - 3600);

            const hash = keccak256(encodePacked(
                ["address", "address", "uint256", "uint256", "uint256", "address"],
                [owner, spender, value, nonce, deadline, tokenTLS.address]
            ));
            const signature = await aliceWallet.signMessage({
                message: { raw: hash }
            });
            await assert.rejects(
                tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature])
            )
        })
    })
    // ========== Allowance ==========
    describe("Allowance", async function(){
        it("Allowance should be correctly updated after permit...", async function(){
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
            await tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature]);
            const allowance = await tokenTLS.read.allowance([owner, spender]);
            assert.equal(allowance, value);
        })
        it("transferFrom() should work after permit...", async function(){
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
                message : {raw : hash}
            });
            await tokenTLS.write.permit([owner, spender, value, nonce, deadline, signature]);
            const balanceBefore = await tokenTLS.read.balanceOf([bobWallet.account.address]);
            await tokenTLS.write.transferFrom([
                owner, spender, value
            ], {
                account: bobWallet.account 
            });
            const balanceAfter = await tokenTLS.read.balanceOf([bobWallet.account.address]);
            assert.equal(balanceAfter, balanceBefore + value);
        })
        it("transferFrom() should fail if permit was not permitted...", async function(){
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
            
            await assert.rejects(
                tokenTLS.write.transferFrom([
                    owner, spender, value
                ], {
                    account: bobWallet.account
                })
            );
        })
    })
})
import assert from "node:assert/strict";
import { describe, it, beforeEach} from "node:test";
import { network } from "hardhat";
import hre from "hardhat";
import {parseUnits, keccak256, encodePacked} from "viem";
import { getContract, createWalletClient, http } from "viem";
import fs from "node:fs";
import { tree, root } from "../scripts/generateMerkleTree.js";

describe("MembershipBoard", () => {
    let memberShipBoard: any;
    let owner: any;
    let nonOwner: any;
    let publicClient: any;

    const DECIMALS = 18;
    const amt = (n: number) => parseUnits(String(n), DECIMALS)
    const membersData = JSON.parse(fs.readFileSync("./members.json", "utf-8"));
    const members: string[] = membersData.addresses;

    beforeEach(async () => {
        const {viem} = await network.connect();
        publicClient = viem.getPublicClient();
        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        nonOwner = wallets[1];
        memberShipBoard = await viem.deployContract("MembershipBoard", [owner.account.address]);
    })
    
    //========== Adding Members ==========
    describe("Adding Members", function(){
        it("Owner can add a single member via addMember()", async function(){
            const member = members[0];
            await memberShipBoard.write.addMember([member]);
            const isMember = await memberShipBoard.read.members([member]);
            assert.equal(isMember, true);
        })
        it("Non-owner cannot add a member", async function (){
            await assert.rejects(
                memberShipBoard.write.addMember([nonOwner.account.address], {account: nonOwner.account})
            )
        })
        it("Adding a duplicate member reverts", async function(){
            const member = members[0];
            await memberShipBoard.write.addMember([member]);
            await assert.rejects(
                memberShipBoard.write.addMember([member])
            )
        })
        it("Owner can batch add members via batchAddMembers()", async function(){
            const membersToAdd = members.slice(0, 5);
            await memberShipBoard.write.batchAddMembers([membersToAdd]);
            for(const member of membersToAdd){
                const isMember = await memberShipBoard.read.members([member]);
                assert.equal(isMember, true);
            }
        })
        it("Adding a duplicate in a batch reverts", async function(){
            const membersToAdd = members.slice(0, 5);
            const member = membersToAdd[0];
            await memberShipBoard.write.batchAddMembers([membersToAdd]);
            await assert.rejects(
                memberShipBoard.write.addMember([member])
            )
        })
        it("All 1,00 members are correctly stored after batch added", async function(){
            const batchSize = 100;
            for(let i = 0; i < members.length; i += batchSize){
                const batch = members.slice(i, i + batchSize);
                await memberShipBoard.write.batchAddMembers([batch]);
            }
            for(const member of members){
                const isMember = await memberShipBoard.read.members([member]);
                assert.equal(isMember, true);
            }
        })
    })
    // =========== Setting Merkle Root ==========
    describe("Setting Merkle Root", function(){
        it("Owner can set the Merkle root", async function(){
            const root = tree.root;
            await memberShipBoard.write.setMerkleRoot([root]);
            const storedRoot = await memberShipBoard.read.merkleRoot();
            assert.equal(storedRoot, root);
        })
        it("Non-owner cannot set the Merkle root", async function(){
            await assert.rejects(
                memberShipBoard.write.setMerkleRoot([root], {account: nonOwner.account})
            )
        })
    })
    // ========== Verification (Mapping) ==========
    describe("Verification (Mapping)", function(){
        it("Returns true for a registered member", async function(){
            const member = members[0];
            await memberShipBoard.write.addMember([member]);
            const isMember = await memberShipBoard.read.verifyMemberByMapping([member]);
            assert.equal(isMember, true);
        })
        it("Returns false for a non-member", async function(){
            const nonMember = nonOwner.account.address;
            const isMember = await memberShipBoard.read.verifyMemberByMapping([nonMember]);
            assert.equal(isMember, false);
        })
    })
    // ========== Verification (Merkle Proof) ==========
    describe("Verification (Merkle Proof)", function(){
        it("Valid proof for a registered member returns true", async function(){
            const member = members[0];
            const proof = tree.getProof(0);
            await memberShipBoard.write.setMerkleRoot([root]);
            const isValid = await memberShipBoard.read.verifyMemberByProof([member, proof]);
            assert.equal(isValid, true);
        })
        it("Invalid proof returns false", async function(){
            const member0 = members[0];
            const member1 = members[1];
            const proof = tree.getProof(1);
            await memberShipBoard.write.setMerkleRoot([root]);
            const isValid = await memberShipBoard.read.verifyMemberByProof([member0, proof]);
            assert.equal(isValid, false);
        })
        it("Proof for a non-member returns false", async function(){
            const nonMember = nonOwner.account.address;
            const stolenProof = tree.getProof(0);
            await memberShipBoard.write.setMerkleRoot([root]);
            const isValid = await memberShipBoard.read.verifyMemberByProof([nonMember, stolenProof]);
            assert.equal(isValid, false);
        })
    })
})
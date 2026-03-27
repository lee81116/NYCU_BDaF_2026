import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import fs from "node:fs";
import { tree, root } from "../scripts/generateMerkleTree.js";

describe("Gas Profiling", function(){
    let memberShipBoard: any;
    let owner: any;
    let publicClient: any;

    const membersData = JSON.parse(fs.readFileSync("./members.json", "utf-8"));
    const members: string[] = membersData.addresses;

    beforeEach(async () => {
        const {viem} = await network.connect();
        publicClient = await viem.getPublicClient();
        const wallets = await viem.getWalletClients();
        owner = wallets[0];
        memberShipBoard = await viem.deployContract("MembershipBoard", [owner.account.address]);
    })

    // ========== Gas Profiling ==========
    it("gas: addMember single call", async function(){
        const tx = await memberShipBoard.write.addMember([members[0]]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log("addMember gas:", receipt.gasUsed.toString());
    })
    it("gas: batchAddMembers 1000 (batch size 50)", async function(){
        const batchSize = 50;
        let totalGas = 0n;
        for(let i = 0; i < members.length; i += batchSize){
            const batch = members.slice(i, i + batchSize);
            const tx = await memberShipBoard.write.batchAddMembers([batch]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            totalGas += receipt.gasUsed;
        }
        console.log("batchAddMembers (size 50) total gas:", totalGas.toString());
        console.log("batchAddMembers (size 50) per member:", (totalGas / 1000n).toString());
    })
    it("gas: batchAddMembers 1000 (batch size 100)", async function(){
        const batchSize = 100;
        let totalGas = 0n;
        for(let i = 0; i < members.length; i += batchSize){
            const batch = members.slice(i, i + batchSize);
            const tx = await memberShipBoard.write.batchAddMembers([batch]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            totalGas += receipt.gasUsed;
        }
        console.log("batchAddMembers (size 100) total gas:", totalGas.toString());
        console.log("batchAddMembers (size 100) per member:", (totalGas / 1000n).toString());
    })
    it("gas: batchAddMembers 1000 (batch size 250)", async function(){
        const batchSize = 250;
        let totalGas = 0n;
        for(let i = 0; i < members.length; i += batchSize){
            const batch = members.slice(i, i + batchSize);
            const tx = await memberShipBoard.write.batchAddMembers([batch]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            totalGas += receipt.gasUsed;
        }
        console.log("batchAddMembers (size 250) total gas:", totalGas.toString());
        console.log("batchAddMembers (size 250) per member:", (totalGas / 1000n).toString());
    })
    it("gas: batchAddMembers 1000 (batch size 500)", async function(){
        const batchSize = 500;
        let totalGas = 0n;
        for(let i = 0; i < members.length; i += batchSize){
            const batch = members.slice(i, i + batchSize);
            const tx = await memberShipBoard.write.batchAddMembers([batch]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            totalGas += receipt.gasUsed;
        }
        console.log("batchAddMembers (size 500) total gas:", totalGas.toString());
        console.log("batchAddMembers (size 500) per member:", (totalGas / 1000n).toString());
    })
    it("gas: setMerkleRoot", async function(){
        const tx = await memberShipBoard.write.setMerkleRoot([root]);
        const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
        console.log("setMerkleRoot gas:", receipt.gasUsed.toString());
    })
    it("gas: verifyMemberByMapping", async function(){
        await memberShipBoard.write.addMember([members[0]]);
        const gas = await memberShipBoard.estimateGas.verifyMemberByMapping([members[0]]);
        console.log("verifyMemberByMapping gas:", gas.toString());
    })
    it("gas: verifyMemberByProof", async function(){
        await memberShipBoard.write.setMerkleRoot([root]);
        const proof = tree.getProof(0);
        const gas = await memberShipBoard.estimateGas.verifyMemberByProof([members[0], proof]);
        console.log("verifyMemberByProof gas:", gas.toString());
    })
})
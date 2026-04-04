import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    version: "0.8.28",
  },
  networks: {
    // Zircuit Garfield 
    zircuit: {
      type: "http",
      url: "https://garfield-testnet.zircuit.com",
      accounts: [
        process.env.OWNER_PRIVATE_KEY,
        process.env.ALICE_PRIVATE_KEY,
        process.env.BOB_PRIVATE_KEY,
      ].filter(Boolean) as string[],
    },
    // Ethereum Sepolia
    sepolia: {
      type: "http",
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: [
        process.env.OWNER_PRIVATE_KEY,
      ].filter(Boolean) as string[],
    },
  },
  verify: {
    etherscan: {
      enabled: true,
      apiKey: process.env.ETHERSCAN_API_KEY || "",
    },
    sourcify: {
      enabled: true,
    },
  }
});
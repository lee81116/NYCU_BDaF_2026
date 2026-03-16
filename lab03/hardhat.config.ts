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
  },
  // Zircuit Garfield Testnet use Sourcify
  verify: {
    etherscan: {
      enabled: false,
    },
    blockscout: {
      enabled: false,
    },
    sourcify: {
      enabled: true,
    },
  }
});
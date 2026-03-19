import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Labo1DeployModule", (m) => {
  // 1. deploy Token A
  const tokenA = m.contract("TokenA");

  // 2. deploy Token B
  const tokenB = m.contract("TokenB");

  // 3. deploy DEX
  const DEX = m.contract("DEX", [tokenA, tokenB, 2]);

  // return the deployed contracts
  return { tokenA, tokenB, DEX };
});
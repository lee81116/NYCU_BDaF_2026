import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Lab02DeployModule", (m) => {
  // 1. deploy Token A
  const tokenA = m.contract("TokenA");

  // 2. deploy Token B
  const tokenB = m.contract("TokenB");

  // 3. deploy TokenTrade
  const tokenTrade = m.contract("TokenTrade", [tokenA, tokenB]);

  // return the deployed contracts
  return { tokenA, tokenB, tokenTrade };
});
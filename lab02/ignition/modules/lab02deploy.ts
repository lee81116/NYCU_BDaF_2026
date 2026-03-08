import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Lab02DeployModule", (m) => {
  // 1. 部署 Token A
  const tokenA = m.contract("TokenA");

  // 2. 部署 Token B
  const tokenB = m.contract("TokenB");

  // 3. 部署 TokenTrade，並把剛剛部署好的 TokenA 和 TokenB 傳進去當參數
  const tokenTrade = m.contract("TokenTrade", [tokenA, tokenB]);

  // 回傳結果
  return { tokenA, tokenB, tokenTrade };
});
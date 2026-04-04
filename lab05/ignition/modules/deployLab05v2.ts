import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenLab05V2Module", (m) => {
  // 只部署 V2 implementation，不動 Proxy
  const implV2 = m.contract("TokenLab05V2");

  return { implV2 };
});
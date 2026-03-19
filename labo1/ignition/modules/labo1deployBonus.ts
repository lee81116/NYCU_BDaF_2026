import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TOKEN_A_ADDR = "0xCaFB582BF6741Fab4d27aFc04c1f46Db46953780";
const TOKEN_B_ADDR = "0xdFa9ae31513a6D2A78f30299269da7d42E4F19eD";
const FEE_RECIPIENT_ADDR = "0x3AD64ABb43D793025a2f2bD9d615fa1447008bFD"; 

export default buildModule("Labo1DeployBonusModule", (m) => {
  // 引用已部署的合約，不重新部署
  const tokenA = m.contractAt("TokenA", TOKEN_A_ADDR);
  const tokenB = m.contractAt("TokenB", TOKEN_B_ADDR);

  // 重新部署 DEX，加上第四個參數
  const DEX = m.contract("DEX", [tokenA, tokenB, 2, FEE_RECIPIENT_ADDR]);

  return { tokenA, tokenB, DEX };
});
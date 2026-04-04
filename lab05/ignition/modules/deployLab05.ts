import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenLab05Module", (m) => {
  // Deploy the implementation contract
  const impl = m.contract("TokenLab05");

  // Encode the initialization data for the proxy
  const initData = m.encodeFunctionCall(impl, "initialize", [
    "TokenLab05",
    "LB5",
    100000000n * (10n ** 18n)
  ]);

  // Deploy the proxy contract, pointing it to the implementation with init data
  const proxy = m.contract("TokenProxy", [impl, initData]);

  return { impl, proxy};
});
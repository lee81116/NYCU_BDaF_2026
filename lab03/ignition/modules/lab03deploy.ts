import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Lab03DeployModule", (m) => {
    const tokenTLS = m.contract("TokenTLS");
    return { tokenTLS };
})
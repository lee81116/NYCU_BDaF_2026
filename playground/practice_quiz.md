# 🎓 NYCU BDaF 2026 模擬上機考

為了讓你熟悉今天可能出現的考題，我設計了一個集結了 **ERC20**、**簽章驗證** 與 **EVM 基礎** 的綜合練習題。

---

## 第一部分：Solidity 實作題 (40%)

### 題目：`TokenDistributor` 合約

請寫一個名為 `TokenDistributor` 的合約，功能如下：
1. **持有者控制**：合約有一個 `owner`。
2. **存入代幣**：合約擁有者可以存入特定的 ERC20 代幣到合約中（用於發放）。
3. **簽名領取 (Signed Claim)**：使用者只要提供由 `owner` 簽署的授權訊息，就能領取固定數量的代幣。
   - 簽名訊息內容需包含：`user address`, `amount`, `nonce`。
   - 必須防止 **重放攻擊 (Replay Attack)**：同一個簽名不能領取兩次。
   - 簽名必須由 `owner` 生成。

**提示：**
- 使用 `ECDSA.recover` 驗證簽章。
- 使用 `nonces` mapping。
- 訊息 hash 建議用 `MessageHashUtils.toEthSignedMessageHash`。

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TokenDistributor {
    address public owner;
    IERC20 public token;
    mapping(address => uint256) public nonces;

    constructor(address _token) {
        owner = msg.sender;
        token = IERC20(_token);
    }

    function claim(uint256 amount, bytes memory signature) external {
        // --- 你的程式碼 ---
        // 1. 生成 hash (user, amount, nonce)
        // 2. 轉成 EthSignedMessageHash
        // 3. recover 出 signer
        // 4. check signer == owner
        // 5. 更新 nonce 並轉帳
    }
}
```

---

## 第二部分：Hardhat 測試練習 (30%)

請參考 `lab03` 的經驗，補全以下測試腳本，驗證 `claim` 功能。

```typescript
it("Should allow user to claim with valid signature", async function () {
    const amount = parseUnits("100", 18);
    const nonce = await distributor.read.nonces([alice.account.address]);
    
    // 1. 在鏈下生成 Hash
    const hash = keccak256(encodePacked(
        ["address", "uint256", "uint256"],
        [alice.account.address, amount, nonce]
    ));

    // 2. 由 owner (deployer) 簽章
    const signature = await deployer.signMessage({
        message: { raw: hash }
    });

    // 3. 呼叫合約
    await distributor.write.claim([amount, signature], { account: alice.account });

    // 4. 斷言 Alice 的餘額增加了 100
    // ...
});
```

---

## 第三部分：EVM 概念題 (30%)

1. **Storage vs Memory**：在練習題中，如果你把 `nonces` 存在 `memory` 會發生什麼事？為什麼 `nonces` 必須存在 `storage`？
2. **`msg.sender` vs `tx.origin`**：如果你想檢查「是誰在跟我互動」，為什麼通常用 `msg.sender` 而不是 `tx.origin`？
3. **Gas Cost**：在 EVM 中，哪一類操作最貴？(A) 數學運算 (B) 讀取 Memory (C) 寫入新資料到 Storage (SSTORE)。

---

## 🚀 練習建議
你可以直接在 `lab03` 資料夾下新建一個合約與測試，試著跑跑看。如果卡住了，隨時問我！

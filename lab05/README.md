# BDaF 2026 Lab05 — Proxy Patterns & Upgradeable Contracts

**Student ID:** 314554045

---

## Deployed Contracts

| Contract | Address |
|---|---|
| TokenLab05 V1 | [`0x1e30A2db9a88b3D50E0C42Ef57a8d60a0c2A26C3`](https://sepolia.etherscan.io/address/0x1e30A2db9a88b3D50E0C42Ef57a8d60a0c2A26C3) |
| TokenLab05 V2 | [`0x24Ef7ffBe4B4633b7a94BcC2e4703143622155a4`](https://sepolia.etherscan.io/address/0x24Ef7ffBe4B4633b7a94BcC2e4703143622155a4) |
| **ERC20 Proxy** | [`0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d`](https://sepolia.etherscan.io/address/0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d) |

---

## Transaction Hashes

| Action | Transaction Hash |
|---|---|
| `stake` | `0x503ccb57fd7d14ccafe1bceb80c85368bd6f6edbf7a7ef46904295cb07a4e3bf` |
| `unstake` attempt | `0x894c37bbdf26cfc57b672db611fa4e76b3434d5b8cfcc0f269f18a909eeb254d` |
| `mint` (NFT received) | `0x128769fd74b6e3c54b2612ef08106fa617127519452023338e67cba44660eaf7` |

---

## Contract Overview

### TokenLab05 V1 (`contracts/tokenLab05.sol`)

An upgradeable ERC20 using OpenZeppelin's UUPS pattern:

- Inherits `ERC20Upgradeable`, `UUPSUpgradeable`, `OwnableUpgradeable`
- `initialize(name, symbol, amount)`
- `_authorizeUpgrade`

### TokenLab05 V2 (`contracts/tokenLab05v2.sol`)

Upgraded implementation adding one new function:

- `burnFrom(address account, uint256 amount)` — owner-only function to burn tokens from any account

### TokenProxy (`contracts/TokenProxy.sol`)

A thin wrapper around `ERC1967Proxy` used to deploy the proxy.

---

## Scripts

| Script | Description |
|---|---|
| `scripts/Stake.ts` | Approve StakeForNFT then call `stake` with 10,000 tokens |
| `scripts/Unstake.ts` | Attempt to call `unstake` |
| `scripts/Upgrade.ts` | Upgrade proxy implementation from V1 to V2 |
| `scripts/Burn.ts` | Use V2's `burnFrom` to drain StakeForNFT's token balance |
| `scripts/Mint.ts` | Call `mint` on StakeForNFT to receive the NFT |

---

## Write-Up

### 1. What happened when you called `unstake`? Did you get your tokens back?

The `unstake` transaction was sent and did not revert, but the tokens were **not returned**. The on-chain bytecode of the deployed `StakeForNFT` contract behaved differently from the source code shown in the lab spec — the actual `unstake` function is a no-op (or does something other than returning tokens).

### 2. How did you retrieve your tokens (and meet the `mint` condition)?

1. **Deploy TokenLab05 V2** — a new implementation that adds `burnFrom(address, uint256)`, callable only by the owner.
2. **Upgrade the proxy** — call `upgradeToAndCall(V2_ADDR, "0x")` through the proxy. Because the proxy is UUPS and I am the owner, this redirects all future calls to V2's logic while preserving the existing storage (balances, etc.).
3. **Burn the tokens** — call `burnFrom(StakeForNFT_ADDR, balance)` as owner to reduce the StakeForNFT contract's balance to 0.
4. **Mint the NFT** — with the balance now 0, call `mint()` on StakeForNFT to receive the NFT.

### 3. What does this teach you about interacting with unverified contracts?

Never trust source code shown off-chain. The function selector (`unstake()` → `0x2def6620`) is fixed, but the implementation behind it can do anything — including silently doing nothing like `StakeForNFT` did in this lab. Therefore, always verify the on-chain bytecode, and treat unverified contracts as adversarial.

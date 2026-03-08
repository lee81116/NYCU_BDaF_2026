# Lab02 — Peer to Peer Token Trade

A peer-to-peer ERC20 trading smart contract deployed on Zircuit Garfield Testnet. Users can create time-limited trade offers and others can fulfill them before expiry. The contract charges a 0.1% fee on successful trades, withdrawable by the owner.

## Contracts

| Contract | Address | Sourcify |
|----------|---------|----------|
| TokenA (TKA) | `0x527b5F7d55B207f72Ba6a89Ff15EB96Becd3B429` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x527b5F7d55B207f72Ba6a89Ff15EB96Becd3B429) |
| TokenB (TKB) | `0x1e30A2db9a88b3D50E0C42Ef57a8d60a0c2A26C3` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x1e30A2db9a88b3D50E0C42Ef57a8d60a0c2A26C3) |
| TokenTrade | `0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x5cfc20B6e9Ba3Ae3284cd8c784B17B5fBe1b6E2d) |

**Network**: Zircuit Garfield Testnet (Chain ID: 48898)

## Transaction Hashes

| Action | Tx Hash |
|--------|---------|
| Alice sets up trade | `0x73bf2ecaed8df3f93e96ac2be2d465579abf82c38b7daa7fea1ea8fe3cf16ffc` |
| Bob settles trade | `0x126ae44a597d4afa4fefd457ceb7dc1254621d70898027a89d13365844649ce8` |
| Owner withdraws fee | `0xc451e1cc739303a9c9f9121b998cb65953d82f93cc084d3857a2a256bce4a424` |

## Features

- **TokenA & TokenB**: Standard ERC20 tokens, each with 100,000,000 supply and 18 decimals
- **setupTrade**: Seller escrows tokens and creates a trade with a specified ask amount and expiry
- **settleTrade**: Buyer fulfills the trade, paying the seller and receiving escrowed tokens minus 0.1% fee
- **cancelTrade**: Seller can cancel and reclaim escrowed tokens if the trade hasn't been settled
- **withdrawFee**: Owner withdraws accumulated protocol fees

## Setup

```bash
npm install
```

## Testing

```bash
npx hardhat test
```

All 26 tests cover: deployment, setupTrade, settleTrade, cancelTrade, and withdrawFee (both success paths and revert checks).

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/lab02deploy.ts --network zircuit --verify
```

## Verify (manual)

```bash
npx hardhat verify --network zircuit --contract contracts/TokenA.sol:TokenA <TOKEN_A_ADDRESS>
npx hardhat verify --network zircuit --contract contracts/TokenB.sol:TokenB <TOKEN_B_ADDRESS>
npx hardhat verify --network zircuit <TOKEN_TRADE_ADDRESS> <TOKEN_A_ADDRESS> <TOKEN_B_ADDRESS>
```

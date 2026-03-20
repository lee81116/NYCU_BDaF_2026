# Labo1 — DEX with Constant Product Formula

A Decentralized Exchange (DEX) smart contract implementing a constant product formula with a price multiplier `r`. The exchange logic follows the formula `x + r * y = k`, where `x` and `y` are the reserves of `TokenA` and `TokenB`, and `r` is a configurable rate. The contract supports liquidity provision, swapping with fee collection, and fee withdrawals by a designated recipient.

## Contract

| Contract | Address | Sourcify |
|----------|---------|----------|
| TokenA (TKA) | `0xCaFB582BF6741Fab4d27aFc04c1f46Db46953780` | [Verified](https://sourcify.dev/server/repo-ui/48898/0xCaFB582BF6741Fab4d27aFc04c1f46Db46953780) |
| TokenB (TKB) | `0xdFa9ae31513a6D2A78f30299269da7d42E4F19eD` | [Verified](https://sourcify.dev/server/repo-ui/48898/0xdFa9ae31513a6D2A78f30299269da7d42E4F19eD) |
| DEX | `0xBB7808eb02400eCD647bAB5f8D1E36b2c3C323fC` | [Verified](https://sourcify.dev/server/repo-ui/48898/0xBB7808eb02400eCD647bAB5f8D1E36b2c3C323fC) |

**Network**: Zircuit Garfield Testnet

## Address

| Name     | Address |
|-------------|---------|
| Deployer (Owner) | `0xe9b9ce9589c6e4d322e134a2e2a19d2695114a2b` |
| Fee Recipient | `0x3AD64ABb43D793025a2f2bD9d615fa1447008bFD` |
| On-Site Checker | `0xa6FF20737004fb2f632B6b9388C7731B871a201D` |

## Flow Demo

The on-chain flow demo script (`scripts/FlowDemo.ts`) demonstrates the full DEX lifecycle:

1. **Approval**: Deployer approves DEX to spend TokenA and TokenB.
2. **Add Liquidity**: Deployer adds 100 TKA and 50 TKB to the DEX.
3. **On-Site Validation**: Deployer transfers tokens to the `OnSiteChecker` and calls `check()` and `checkBonus()` 

```bash
npx hardhat run scripts/FlowDemo.ts --network zircuit
```

## Deploy

### Standard Deployment
```bash
npx hardhat ignition deploy ignition/modules/labo1deploy.ts --network zircuit
```

### Bonus Deployment (with Fee Recipient)
```bash
npx hardhat ignition deploy ignition/modules/labo1deployBonus.ts --network zircuit
```

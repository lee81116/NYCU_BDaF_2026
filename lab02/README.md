# Lab02 — Peer to Peer Token Trade

A peer-to-peer ERC20 trading smart contract deployed on Zircuit Garfield Testnet. Users can create time-limited trade offers and others can fulfill them before expiry. The contract charges a 0.1% fee on successful trades, withdrawable by the owner.

## Contracts

| Contract | Address | Sourcify |
|----------|---------|----------|
| TokenA (TKA) | `0x24EFc2B61deC3549D46fFDc76077D7753D33a382` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x24EFc2B61deC3549D46fFDc76077D7753D33a382) |
| TokenB (TKB) | `0x2831d275dADCb29F0367Ea388118bE4d2DCe93b5` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x2831d275dADCb29F0367Ea388118bE4d2DCe93b5) |
| TokenTrade | `0x171a1454251FDFC5F5AEA9335C456Ed3e62Fe361` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x171a1454251FDFC5F5AEA9335C456Ed3e62Fe361) |

**Network**: Zircuit Garfield Testnet (Chain ID: 48898)

## Address

| Name   | Address |
|--------|---------|
| Alice  | `0x236175e8FB503e9CA7021f954AE2e1949715C0f1` |
| Bob    | `0xb76E96a1023435D5bC41Bc3Cd47DF6D77e66b781` |
| Owner  | `0xE9b9cE9589c6E4D322e134A2e2a19d2695114a2B` |

## Transaction Hashes

| Action | Tx Hash |
|--------|---------|
| Alice sets up trade | `0xe50dc43428a3c4c684e011daeca272f9bc4057dd2179d420e23f589d3382ecb0` |
| Bob settles trade | `0x5e254746c594a4db1797418a4050539d1184b75fdf173ac6b34e4eff8c56d5db` |
| Owner withdraws fee | `0xdd31902fb562387ec6a49e72f21c06bcc29bfdb1e681a338f16a124d416fe8f3` |

## Features

- **TokenA & TokenB**: Standard ERC20 tokens, each with 100,000,000 supply and 18 decimals
- **setupTrade**: Seller escrows tokens and creates a trade with a specified ask amount and expiry
- **settleTrade**: Buyer fulfills the trade, paying the seller and receiving escrowed tokens minus 0.1% fee
- **cancelTrade**: Seller can cancel and reclaim escrowed tokens if the trade hasn't been settled
- **withdrawFee**: Owner withdraws accumulated protocol fees

## Testing

```bash
npx hardhat test
```

The comprehensive test suite includes 26 tests covering all state modifications, event emissions, edge cases, and revert paths.

### 1. Deployment Requirements
- ✅ Should set the correct owner
- ✅ Should set the correct tokenA and tokenB addresses
- ✅ Should start with tradeCounter = 0

### 2. `setupTrade`
- ✅ Should create a trade and escrow tokens successfully
- ✅ Should emit `TradeSetup` event
- ✅ Should auto-determine askToken as tokenB when selling tokenA
- ✅ Should revert if inputTokenAmount is 0
- ✅ Should revert if outputTokenAsk is 0
- ✅ Should revert if expiry is in the past
- ✅ Should revert if inputToken is not tokenA or tokenB
- ✅ Should revert if inputTokenAmount < 1000 (fee minimum algorithm check)

### 3. `settleTrade`
- ✅ Should settle a trade: buyer pays seller, buyer receives tokens minus 0.1% protocol fee
- ✅ Should emit `TradeSettled` event
- ✅ Should mark the trade as completed
- ✅ Should revert on invalid trade ID
- ✅ Should revert if trade is already completed
- ✅ Should revert if trade is expired
- ✅ Should revert if seller tries to settle their own trade

### 4. `cancelTrade`
- ✅ Should allow seller to cancel and recover escrowed tokens
- ✅ Should emit `TradeCancelled` event
- ✅ Should mark trade as completed after cancellation to prevent multiple settles/cancels
- ✅ Should revert if non-seller tries to cancel
- ✅ Should revert if trade is already completed

### 5. `withdrawFee`
- ✅ Should allow owner to withdraw accumulated fees for both tokens
- ✅ Should revert if non-owner tries to withdraw fees
- ✅ Should succeed even when only one token has accumulated fees

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

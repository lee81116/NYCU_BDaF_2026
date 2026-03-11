# Lab02 — Peer to Peer Token Trade

A peer-to-peer ERC20 trading smart contract deployed on Zircuit Garfield Testnet. Users can create time-limited trade offers and others can fulfill them before expiry. The contract charges a 0.1% fee on successful trades, withdrawable by the owner.

## Contracts

| Contract | Address | Sourcify |
|----------|---------|----------|
| TokenA (TKA) | `0x20387311991631aaBa1BD97A6A22cc0B557bbAC9` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x20387311991631aaBa1BD97A6A22cc0B557bbAC9) |
| TokenB (TKB) | `0x0f030E5B9055fd0ACAcE9C7A5013C7EFB7145051` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x0f030E5B9055fd0ACAcE9C7A5013C7EFB7145051) |
| TokenTrade | `0x6C6Fe145f942b4c978b2F752363D92D5A09c597b` | [Verified](https://sourcify.dev/server/repo-ui/48898/0x6C6Fe145f942b4c978b2F752363D92D5A09c597b) |

**Network**: Zircuit Garfield Testnet

## Address

| Name   | Address |
|--------|---------|
| Alice  | `0x236175e8FB503e9CA7021f954AE2e1949715C0f1` |
| Bob    | `0xb76E96a1023435D5bC41Bc3Cd47DF6D77e66b781` |
| Owner  | `0xE9b9cE9589c6E4D322e134A2e2a19d2695114a2B` |

## Transaction Hashes

| Action | Tx Hash |
|--------|---------|
| Alice sets up trade | `0xcb9122370c6735ff2361b5e92e10f31a680598923d4b486bf22078008756b6ad` |
| Bob settles trade | `0xf2a28fe0eb4895cbe7ec54fc3afa483c3d7031f8dbaab233aa659db14290eabe` |
| Owner withdraws fee | `0xe3ca774a36ce8d3823625aa565ea58611ab396e810eaea1c261f1b1a650e6666` |

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
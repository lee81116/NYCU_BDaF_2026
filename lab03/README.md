# Lab03 — ERC20 Token with Off-Chain Permit

An ERC20 token smart contract with a custom `permit()` function deployed on Zircuit Garfield Testnet. The `permit()` enables gasless approvals — token owners sign an off-chain message, and any third party can submit the signature on-chain to set the allowance, eliminating the need for the owner to send an `approve()` transaction themselves.

## Contract

| Contract | Address | Sourcify |
|----------|---------|----------|
| TokenTLS (TLS) | `0xF269871a76Fda36DB632bDD1Db519e9822F3FFb3` | [Verified](https://sourcify.dev/server/repo-ui/48898/0xF269871a76Fda36DB632bDD1Db519e9822F3FFb3) |

**Network**: Zircuit Garfield Testnet

## Address

| Name     | Address |
|-------------|---------|
| Deployer (Owner) | `0x236175e8fb503e9ca7021f954ae2e1949715c0f1` |
| Alice    | `0xe9b9ce9589c6e4d322e134a2e2a19d2695114a2b` |
| Bob      | `0xb76e96a1023435d5bc41bc3cd47df6d77e66b781` |

## Transaction Hashes

| Action | Tx Hash |
|--------|---------|
| Deployer transfers 10,000 TLS to Alice | `0xdc976525f84d7ee0f552dfb77f7ae3831d5891f0505b43bffc2e5e1952d831cf` |
| Bob submits `permit()` with Alice's signature | `0x0e48a536bead4ed4106e3883e67b2a13fa2362cdafcd43d2d176ca36eddd1c1f` |
| Bob calls `transferFrom()` to receive tokens | `0x20f8004d7a3c26ec9e6184013d88f8748121cb894d0706453c3a99369d9c511e` |

## Testing

```bash
npx hardhat test
```

### 1. Pre-setup
- ✅ Alice should have all tokens after deployment

### 2. Signature Verification
- ✅ Valid signature should successfully execute permit
- ✅ Signature from wrong signer should fail

### 3. Nonce Protection
- ✅ Nonce should increase after successful permit
- ✅ Reusing the same signature should fail

### 4. Expiry
- ✅ Expired signature should fail

### 5. Allowance
- ✅ Allowance should be correctly updated after permit
- ✅ `transferFrom()` should work after permit
- ✅ `transferFrom()` should fail if permit was not permitted

## Flow Demo

The on-chain flow demo script (`scripts/FlowDemo.ts`) demonstrates the full permit + transferFrom lifecycle:

1. **Deployer → Alice**: Transfer 10,000 TLS tokens to Alice
2. **Alice signs off-chain**: Alice signs an approval message granting Bob 1,000 TLS allowance
3. **Bob submits permit()**: Bob broadcasts Alice's signature on-chain, setting the allowance without Alice paying gas
4. **Bob calls transferFrom()**: Bob transfers 1,000 TLS from Alice to himself using the permit-granted allowance

```bash
npx hardhat run scripts/FlowDemo.ts --network zircuit
```

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/lab03deploy.ts --network zircuit --verify
```

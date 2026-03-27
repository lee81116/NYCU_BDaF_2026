# BDaF 2026 Lab04 — Membership Board: Storage vs. Merkle Trees

A Membership Board contract where an admin manages a list of 1,000 members, implementing membership management using three methods: `addMember`, `batchAddMembers` and `setMerkleRoot`, and compare their gas costs. 

## How to run Tests

```bash
npm install
npx hardhat test
```

Gas profiling tests can be run separately with:

```bash
npx hardhat test test/GasProfiling.ts --gas-stats
```

## Project Structure

- `contracts/MembershipBoard.sol` — Main contract with all 5 functions
- `scripts/generateMerkleTree.ts` — Off-chain Merkle tree generation
- `test/MembershipBoard.ts` — Functional test suite
- `test/GasProfiling.ts` — Gas profiling tests
- `members.json` — Pre-generated list of 1,000 Ethereum addresses
- `generate_members.js` - Generate a fresh list of N addresses

## Gas Profiling Results

### Registration Cost Comparison

| Action | Gas Used |
|--------|----------|
| `addMember` (single call) | 47,843 |
| `addMember` x1000 (total estimated) | 47,843,000 |
| `batchAddMembers` (all 1,000, batch size 100) | 25,353,990 |
| `setMerkleRoot` | 47,561 |

### Verification Cost Comparison

| Action | Gas Used |
|--------|----------|
| `verifyMemberByMapping` | 24,324 |
| `verifyMemberByProof` | 35,520 |

### Batch Size Experimentation

| Batch Size | Total Gas | Per Member Gas |
|-----------|-----------|---------------|
| 50 | 25,596,060 | 25,596 |
| 100 | 25,353,990 | 25,353 |
| 250 | 25,208,748 | 25,208 |
| 500 | 25,160,358 | 25,160 |

## Questions

### 1. Storage Cost Comparison

Three approaches for registering all 1,000 members:

- `addMember` x1000: ~47,843,000 gas (47,843 per call x 1,000 calls)
- `batchAddMembers`: ~25,354,000 gas (batch size 100, 10 batches)
- `setMerkleRoot`: 47,561 gas (single call)

`setMerkleRoot` is by far the cheapest. It only performs one `SSTORE` operation to write a single `bytes32` value, regardless of how many members exist. In contrast, `addMember` and `batchAddMembers` both need to execute an `SSTORE` for every member, and `SSTORE` (writing to a new storage slot) costs 20,000 gas each.

The Merkle tree is constructed off-chain, so the on-chain cost is just storing one root hash.

### 2. Verification Cost Comparison

- `verifyMemberByMapping`: 24,324 gas
- `verifyMemberByProof`: 35,520 gas

The mapping approach is cheaper for verification. It only requires a single `SLOAD` operation to look up the boolean value stored at the member's address in the mapping. The Merkle proof approach requires multiple `keccak256` hash computations (one for each level of the tree, approximately log2(1000) ≈ 10 levels), plus the double hashing of the leaf node, which makes it more computationally expensive.

### 3. Trade-off Analysis

**Prefer mapping when:**
- The membership list changes often, because updating a mapping is straightforward (add/remove individual entries), whereas the Merkle tree requires regenerating the entire tree and updating the root.
- Verification happens very frequently and gas cost per verification matters.

**Prefer Merkle tree when:**
- The membership list is large and rarely changes.
- The verifier (user) is willing to provide a proof and pay for the verification gas themselves.
- Privacy is desired. With the mapping approach, anyone can query the mapping to check if a specific address is a member.
- Deployment cost is a concern. The Merkle tree only costs one `SSTORE`.

### 4. Batch Size Experimentation

| Batch Size | Total Gas | Per Member Gas | # of Batches |
|-----------|-----------|---------------|-------------|
| 50 | 25,596,060 | 25,596 | 20 |
| 100 | 25,353,990 | 25,353 | 10 |
| 250 | 25,208,748 | 25,208 | 4 |
| 500 | 25,160,358 | 25,160 | 2 |

As batch size increases, per-member gas cost decreases. This is because the fixed transaction overhead (21,000 base cost per transaction) is amortized over more members. 

However, the "sweet spot" should depend on the block gas limit. Larger batches are more gas-efficient, but if a batch is too large, it may exceed the block gas limit and fail.

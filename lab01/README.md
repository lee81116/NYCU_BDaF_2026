# EthVault

## Project Description

EthVault is a minimal and secure Ethereum smart contract designed to function as an Ether vault.

Anyone can deposit ETH into the contract, and each successful deposit emits a `Deposit` event for transparency and traceability.

The contract enforces strict access control: only the owner specified at deployment is authorized to withdraw funds. Any unauthorized withdrawal attempt is gracefully handled — instead of reverting, the transaction is ignored and an `UnauthorizedWithdrawAttempt` event is emitted.

Additional safety checks are implemented to prevent overdrawing and ensure the vault’s balance integrity at all times.

## Setup Instructions

1.  Clone this repository.
2.  Navigate to the project directory:
    ```bash
    cd lab01
    ```
3.  Install the necessary dependencies:
    ```bash
    npm install
    ```

## Test Instructions

To execute the automated test suite, which verifies all functional behaviors including deposits, authorized and unauthorized withdrawals, and various edge cases, run the following command:

```bash
npx hardhat test
```

## Solidity Version

- `^0.8.28`

## Framework Used

- **Hardhat** (using the **Viem** plugin and **TypeScript**)

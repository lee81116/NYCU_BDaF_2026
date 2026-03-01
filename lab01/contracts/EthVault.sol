// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EthVault {
    // --- STATE VARIABLES ---
    // TODO: Declare a public variable to store the owner's address. 
    // (Hint: Making it 'immutable' is a good practice since it's only set once)
    
    // --- EVENTS ---
    // TODO: Define Deposit event: event Deposit(...)
    
    // Defined for you based on specific constraints:
    event Withdraw(address indexed to, uint256 amount);
    
    // TODO: Define UnauthorizedWithdrawAttempt event: event UnauthorizedWithdrawAttempt(...)

    // --- CONSTRUCTOR ---
    constructor() {
        // TODO: Set the owner variable to the address deploying the contract (msg.sender)
    }

    // --- RECEIVE ETH ---
    // TODO: Implement receive() external payable { ... } OR fallback() external payable { ... }
    // Inside it: 
    // 1. Accept the ETH (happens automatically if marked payable)
    // 2. Emit the Deposit event with the sender and amount

    // --- WITHDRAW FUNDS ---
    function withdraw(uint256 amount) external {
        if (msg.sender != owner) {
            // UNATHORIZED FLOW
            // TODO: Emit the UnauthorizedWithdrawAttempt event
            
            // TODO: Revert the transaction to prevent the withdrawal! 
            // (Note: Make sure your implementation reverts here)
            revert("Unauthorized access");
        } 
        
        // AUTHORIZED FLOW
        // TODO: Check if the requested amount is <= the contract's balance. Revert if not.
        
        // TODO: Transfer the ETH to the owner. 
        // Example safe method: (bool success, ) = msg.sender.call{value: amount}("");
        // require(success, "Transfer failed");
        
        // TODO: Emit the Withdraw event
    }
}

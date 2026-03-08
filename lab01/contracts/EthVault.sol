// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EthVault {
    // --- STATE VARIABLES ---
    address public immutable owner;

    // --- EVENTS ---
    event Deposit(address indexed sender, uint256 amount);
    event Weethdraw (address indexed to, uint256 amount);
    event UnauthorizedWithdrawAttempt(address indexed caller, uint256 amount);

    // --- CONSTRUCTOR ---
    constructor() {
        // Set the owner variable to the address deploying the contract when instantiated
        owner = msg.sender;
    }

    // --- RECEIVE ETH ---
    // 1. Accept the ETH (happens automatically if marked payable)
    // 2. Emit the Deposit event with the sender and amount
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // --- WITHDRAW FUNDS ---
    function withdraw(uint256 amount) external {
        // UNATHORIZED FLOW
        if (msg.sender != owner) {
            emit UnauthorizedWithdrawAttempt(msg.sender, amount);
            return;
        }

        // AUTHORIZED FLOW
        if (amount > address(this).balance) {
            revert("Insufficient balance...");
        }
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        emit Weethdraw(msg.sender, amount);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract TokenTLS is ERC20 {
    // ---CONSTRUCTOR---
    constructor() ERC20("Token Lab San", "TLS") {
        _mint(msg.sender, 100000000 * 10 ** decimals());
    }

    // ---MAPPINGS---
    mapping(address => uint256) public nonces;

    // ---PERMIT---
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) public{
        bytes32 hash = keccak256(
            abi.encodePacked(
                owner,
                spender,
                value,
                nonce,
                deadline,
                address(this)
            )
        );

        // keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash))
        bytes32 message = MessageHashUtils.toEthSignedMessageHash(hash);
        // Recover address from signature (public key -> keccak256 -> last 20 bytes / 40 hex chars)
        address recovered = ECDSA.recover(message, signature);

        // ---Checks---
        // Check recovered address with owner
        require(recovered == owner, "Invalid signature...");
        // Check nonce
        require(nonce == nonces[owner], "Invalid nonce...");
        // Check deadline
        require(block.timestamp <= deadline, "Expired...");

        // ---Effects---
        nonces[owner]++;

        // ---Interactions---
        _approve(owner, spender, value);
    }
}
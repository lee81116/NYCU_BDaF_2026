// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title UnifiedVault
 * @notice 整合了 Lab 01 (ETH), Lab 02 (ERC20), Lab 03 (Signatures) 的綜合練習合約
 */
contract UnifiedVault {
    // --- STATE VARIABLES ---
    address public owner;
    
    // Lab 02: 記錄每個使用者在不同代幣下的餘額
    mapping(address => mapping(address => uint256)) public tokenBalances;
    
    // Lab 03: 防止重放攻擊的 Nonces
    mapping(address => uint256) public nonces;

    // --- EVENTS ---
    event ETHDeposited(address indexed sender, uint256 amount);
    event TokenDeposited(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);

    // --- CONSTRUCTOR ---
    constructor() {
        owner = msg.sender;
    }

    // --- LAB 01: ETH VAULT 基礎 ---
    // 讓合約可以接收 ETH
    receive() external payable {
        emit ETHDeposited(msg.sender, msg.value);
    }

    // 只有 Owner 可以把合約內的 ETH 領走
    function withdrawETH(uint256 amount) external {
        require(msg.sender == owner, "Only owner can withdraw ETH");
        require(address(this).balance >= amount, "Insufficient ETH balance");
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH transfer failed");
    }

    // --- LAB 02: ERC20 & MAPPING 基礎 ---
    // 存入 ERC20 代幣到合約（需事先透過代幣合約 approve）
    function depositToken(address tokenAddress, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // Interactions: 把使用者的代幣轉進合約
        bool success = IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        require(success, "Token deposit failed");
        
        // Effects: 更新內部帳本
        tokenBalances[msg.sender][tokenAddress] += amount;
        
        emit TokenDeposited(msg.sender, tokenAddress, amount);
    }

    // --- LAB 03: SIGNATURES (ECDSA) 進階 ---
    /**
     * @notice 透過 Owner 的簽名授權使用者提領代幣
     * @param tokenAddress 要提領的代幣地址
     * @param amount 提領金額
     * @param nonce 防止重放攻擊的隨機數
     * @param signature Owner 的簽名
     */
    function signedWithdraw(
        address tokenAddress,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        // 1. 檢查內部餘額是否足夠 (Lab 02 概念)
        require(tokenBalances[msg.sender][tokenAddress] >= amount, "Insufficient balance");
        
        // 2. 檢查 Nonce (Lab 03 概念)
        require(nonce == nonces[msg.sender], "Invalid nonce");

        // 3. 生成訊息 Hash (Lab 03 概念)
        // 注意：為了安全，通常會加入 address(this) 防止跨合約重放
        bytes32 hash = keccak256(
            abi.encodePacked(
                msg.sender,
                tokenAddress,
                amount,
                nonce,
                address(this)
            )
        );
        
        // 4. 轉換為 Ethereum 格式的簽名 hash
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(hash);
        
        // 5. 驗證簽名者是否為 Owner
        address signer = ECDSA.recover(ethSignedHash, signature);
        require(signer == owner, "Invalid owner signature");

        // 6. Effects: 更新狀態
        nonces[msg.sender]++; // 增加 nonce 防止同樣簽名跑兩次
        tokenBalances[msg.sender][tokenAddress] -= amount;

        // 7. Interactions: 轉帳
        bool success = IERC20(tokenAddress).transfer(msg.sender, amount);
        require(success, "Token transfer failed");

        emit Withdraw(msg.sender, tokenAddress, amount);
    }
}

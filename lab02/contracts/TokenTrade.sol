// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenTrade {
    // --- STATE VARIABLES ---
    address public owner;
    address public tokenA;
    address public tokenB;

    uint256 public tokenAFeeBalance;
    uint256 public tokenBFeeBalance;

    struct Trade {
        address seller;
        address inputToken;
        uint256 inputAmount;
        address askToken;
        uint256 askAmount;
        uint256 expiry;
        bool isCompleted;
    }

    // --- MAPPINGS ---
    mapping(uint256 => Trade) public trades;
    uint256 public tradeCounter;

    // --- EVENTS ---
    event TradeSetup(
        uint256 indexed tradeId,
        address indexed seller,
        address inputToken,
        uint256 inputAmount,
        address askToken,
        uint256 askAmount,
        uint256 expiry
    );
    event TradeSettled(uint256 indexed tradeId, address indexed buyer);
    event TradeCancelled(uint256 indexed tradeId);

    // --- CONSTRUCTOR ---
    constructor(address _tokenA, address _tokenB) {
        owner = msg.sender;
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    // --- SETUP TRADE ---
    function setupTrade(
        address inputTokenForSale,
        uint256 inputTokenAmount,
        uint256 outputTokenAsk,
        uint256 expiry
    ) external {
        // --- Checks ---
        // Trade amount above 0
        require(
            inputTokenAmount > 0 && outputTokenAsk > 0,
            "Amounts must be above 0..."
        );
        // Expiry in the future
        require(expiry > block.timestamp, "Expiry must be in the future...");
        // inputTokenForSale is tokenA or tokenB
        require(
            inputTokenForSale == tokenA || inputTokenForSale == tokenB,
            "Invalid input token..."
        );
        // Minimum limit
        require(
            inputTokenAmount >= 1000,
            "Trade amount too small to process fee..."
        );

        // --- Effects ---
        // Get the current trade ID
        uint256 currentTradeId = tradeCounter;

        // Determine the ask token based on the input token
        address askTokenAddress = (inputTokenForSale == tokenA)
            ? tokenB
            : tokenA;

        // Store the trade details in the mapping
        trades[currentTradeId] = Trade({
            seller: msg.sender,
            inputToken: inputTokenForSale,
            inputAmount: inputTokenAmount,
            askToken: askTokenAddress,
            askAmount: outputTokenAsk,
            expiry: expiry,
            isCompleted: false
        });

        // Increment the trade counter
        tradeCounter++;

        // Emit the event
        emit TradeSetup(
            currentTradeId,
            msg.sender,
            inputTokenForSale,
            inputTokenAmount,
            askTokenAddress,
            outputTokenAsk,
            expiry
        );

        // --- Interactions ---
        // Transfer the input tokens from the seller to this contract (Escrow)
        // This requires the seller to have approved this contract in the ERC20 contract beforehand!
        bool success = IERC20(inputTokenForSale).transferFrom(
            msg.sender,
            address(this),
            inputTokenAmount
        );
        require(success, "Token transfer failed...");
    }

    // --- SETTLE TRADE ---
    function settleTrade(uint256 tradeId) external {
        // --- Checks ---
        // Trade ID must exist
        require(tradeId < tradeCounter, "Invalid trade ID...");
        // Trade must not be completed
        require(!trades[tradeId].isCompleted, "Trade already completed...");
        // Trade must not be expired
        require(block.timestamp < trades[tradeId].expiry, "Trade expired...");
        // msg.sender must be the buyer (not the seller)
        require(
            msg.sender != trades[tradeId].seller,
            "Seller cannot settle their own trade..."
        );

        // --- Effects ---
        // Mark the trade as completed
        trades[tradeId].isCompleted = true;

        // Emit the event
        emit TradeSettled(tradeId, msg.sender);

        // --- Interactions ---
        Trade memory trade = trades[tradeId];

        // Fee for owner
        uint256 feeAmount = trade.inputAmount / 1000;
        uint256 buyerAmount = trade.inputAmount - feeAmount;

        if (trade.inputToken == tokenA) {
            tokenAFeeBalance += feeAmount;
        } else {
            tokenBFeeBalance += feeAmount;
        }

        // Bob pays Alice
        bool paySuccess = IERC20(trade.askToken).transferFrom(
            msg.sender,
            trade.seller,
            trade.askAmount
        );
        require(paySuccess, "Payment failed...");

        // Alice delivers to Bob
        bool deliverSuccess = IERC20(trade.inputToken).transfer(
            msg.sender,
            buyerAmount
        );
        require(deliverSuccess, "Delivery failed...");
    }

    // --- WITHDRAW FEE ---
    function withdrawFee() external {
        // --- Checks ---
        require(msg.sender == owner, "Only owner can withdraw fees...");

        // --- Effects ---
        uint256 amountA = tokenAFeeBalance;
        uint256 amountB = tokenBFeeBalance;
        tokenAFeeBalance = 0;
        tokenBFeeBalance = 0;

        // --- Interactions ---
        if (amountA > 0) {
            bool successA = IERC20(tokenA).transfer(owner, amountA);
            require(successA, "Withdrawal A failed...");
        }

        if (amountB > 0) {
            bool successB = IERC20(tokenB).transfer(owner, amountB);
            require(successB, "Withdrawal B failed...");
        }
    }

    // --- TRADE CANCELLED ---
    function cancelTrade(uint256 tradeId) external {
        // --- Checks ---
        require(
            msg.sender == trades[tradeId].seller,
            "Only seller can cancel trade..."
        );
        require(tradeId < tradeCounter, "Invalid trade ID...");
        require(!trades[tradeId].isCompleted, "Trade already completed...");

        // --- Effects ---
        trades[tradeId].isCompleted = true;

        // Emit the event
        emit TradeCancelled(tradeId);

        // --- Interactions ---
        bool retainSuccess = IERC20(trades[tradeId].inputToken).transfer(
            msg.sender,
            trades[tradeId].inputAmount
        );
        require(retainSuccess, "Retain failed...");
    }
}

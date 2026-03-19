// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {
    // Declare Variables
    address public immutable TokenA;
    address public immutable TokenB;
    // x + r * y = k
    uint256 public x;
    uint256 public r;
    uint256 public y;
    uint256 public k;
    // fee recipient
    address public fee_recipient;
    // fee Balances
    uint256 public feeBalanceA;
    uint256 public feeBalanceB;

    // constructor  
    constructor(address _tokenA, address _tokenB, uint256 _r, address _fee_recipient) {
        TokenA = _tokenA;
        TokenB = _tokenB;
        r = _r;
        x = 0;
        y = 0;
        k = 0;
        fee_recipient = _fee_recipient;
    }

    // ADD LIQUIDITY
    function addLiquidity(uint256 amountA, uint256 amountB) external{
        //Checks
        require(amountA > 0 && amountB > 0, "Amounts must be above 0...");
        //Effects
        x += amountA;
        y += amountB;
        k = x + r * y;
        //Interactions
        IERC20(TokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(TokenB).transferFrom(msg.sender, address(this), amountB);
    }
    // SWAP 
    function swap(address tokenIn, uint256 amountIn) external {
        // Checks
        require(tokenIn == TokenA || tokenIn == TokenB, "Invalid token...");
        require(amountIn > 1000, "Amount must be above 1000...");
        require(k > 0, "No liquidity...");
        
        // Effects
        address tokenOut;
        uint256 amountOut;
        uint256 fee;
        if (tokenIn == TokenA) {
            tokenOut = TokenB;
            fee = amountIn/1000;
            amountOut = (amountIn - fee) / r;
            x += (amountIn - fee);
            y -= amountOut;
            feeBalanceA += fee;
        } else {
            tokenOut = TokenA;
            fee = amountIn/1000;
            amountOut = (amountIn - fee) * r;
            x -= amountOut;
            y += (amountIn - fee);
            feeBalanceB += fee;
        }

        //Interactions
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
    }

    // Get Reserves
    function getReserves() external view returns (uint256 reserveA, uint256 reserveB) {
        return (x, y);
    }

    // Bonuses
    function feeRecipient() external view returns (address) {
        return fee_recipient;
    }
    function withdrawFee() external {
        // Checks
        require(msg.sender == fee_recipient, "Only fee recipient can withdraw...");
        require(feeBalanceA > 0 || feeBalanceB > 0, "No fees to withdraw...");

        // Effects
        uint256 feeOutA = feeBalanceA;
        uint256 feeOutB = feeBalanceB;
        feeBalanceA = 0;
        feeBalanceB = 0;
        
        // Interactions
        if(feeOutA > 0) IERC20(TokenA).transfer(msg.sender, feeOutA);
        if(feeOutB > 0) IERC20(TokenB).transfer(msg.sender, feeOutB);
    }
}
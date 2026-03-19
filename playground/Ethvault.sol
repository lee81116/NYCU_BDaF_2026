pragma solidity ^0.8.20;

contract Ethvault{
    address public immutable owner;

    constructor(){
        owner = msg.sender;
    }

    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event UnautherizedWithdrawAttempt(address indexed caller, amount amount);
    
    receive() external payable{
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external{
        //CHECK
        if(msg.sender != owner){
            emit UnautherizedWithdrawAttempt(msg.sender, amount);
            return;
        }
        if(amount > address(this).balance){
            revert ("Insufficient balance...");
        }
        //EFFECT
        emit Withdraw(msg.sender, amount);
        //INTERACTION
        (bool success, )msg.sender.call{ value : amount }("");
        require(success, "Failed...");
    }
}
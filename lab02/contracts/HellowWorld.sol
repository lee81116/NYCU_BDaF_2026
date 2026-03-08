// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string public greeting = "Hello Zircuit!";

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
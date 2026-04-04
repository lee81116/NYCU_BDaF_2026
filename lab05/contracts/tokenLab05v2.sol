// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TokenLab05V2 is ERC20Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    function burnFrom(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

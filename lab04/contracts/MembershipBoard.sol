// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MembershipBoard is Ownable {
    // State Variables
    mapping(address => bool) public members;
    bytes32 public merkleRoot;

    //Constructor
    constructor(address _owner) Ownable(_owner) {}

    // Events
    event MemberAdded(address indexed member);
    event MerkleRootSet(bytes32 indexed root);

    // Add Members One-by-One (Mapping)
    function addMember(address _member) external onlyOwner{
        require(!members[_member], "Already a member...");
        members[_member] = true;
        emit MemberAdded(_member);
    }

    // Batch Add Members (Mapping)
    function batchAddMembers(address[] calldata _members) external onlyOwner{
        for(uint i=0;i<_members.length;i++){
            require(!members[_members[i]], "Including existing member...");
            members[_members[i]] = true;
            emit MemberAdded(_members[i]);
        }
    }
    
    // Set Merkle Root
    function setMerkleRoot(bytes32 _root) external onlyOwner{
        merkleRoot = _root;
        emit MerkleRootSet(_root);
    }

    // Verify Membership (Mapping)
    function verifyMemberByMapping(address _member) external view returns (bool){
        return members[_member];
    }

    // Verify Membership (Merkle Proof)
    function verifyMemberByProof(address _member, bytes32[] calldata _proof) external view returns (bool){
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_member))));
        return MerkleProof.verify(_proof, merkleRoot, leaf);
    }
}
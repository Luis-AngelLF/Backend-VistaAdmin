// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./Verifier.sol";

contract AntigravityBallot {
    enum ElectionState { RegistrationOpen, VotingOpen, VotingClosed }
    ElectionState public state;

    uint256 public electionRootSnapshot;
    uint256[2] public electionPublicKey;

    mapping(uint256 => bool) public nullifiers;

    struct EncryptedVote {
        uint256 c1_x;
        uint256 c1_y;
        uint256 c2_x;
        uint256 c2_y;
    }
    EncryptedVote[] public encryptedVotes;

    Groth16Verifier public verifier;
    address public owner;

    event VoterRegistered(uint256 commitment, uint256 newRoot);
    event ElectionStarted(uint256 snapshotRoot, uint256 blockNumber);
    event VoteCast(uint256 nullifierHash, uint256 c1_x, uint256 c1_y, uint256 c2_x, uint256 c2_y);
    event ElectionClosed();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(uint256[2] memory _electionPublicKey) {
        owner = msg.sender;
        state = ElectionState.RegistrationOpen;
        electionPublicKey = _electionPublicKey;
        verifier = new Groth16Verifier();
    }

    // El admin registra al votante y pasa el nuevo Root del Merkle Tree calculado off-chain
    function addVoter(uint256 commitment, uint256 computedRoot) external onlyOwner {
        require(state == ElectionState.RegistrationOpen, "Registration is not open");
        electionRootSnapshot = computedRoot; // Temporalmente guarda la raíz actual
        emit VoterRegistered(commitment, computedRoot);
    }

    function startVoting() external onlyOwner {
        require(state == ElectionState.RegistrationOpen, "Registration is not open");
        state = ElectionState.VotingOpen;
        emit ElectionStarted(electionRootSnapshot, block.number);
    }

    function verifyAndCast(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256 nullifierHash,
        uint256[2] memory c1,
        uint256[2] memory c2
    ) external {
        require(state == ElectionState.VotingOpen, "Voting is not open");
        require(!nullifiers[nullifierHash], "Identity has already voted");

        // Public inputs para el verifier en orden exacto:
        // [0] = electionRootSnapshot
        // [1] = nullifierHash
        // [2] = PK_e[0]
        // [3] = PK_e[1]
        // [4] = C1[0]
        // [5] = C1[1]
        // [6] = C2[0]
        // [7] = C2[1]
        uint256[8] memory publicSignals;
        publicSignals[0] = electionRootSnapshot;
        publicSignals[1] = nullifierHash;
        publicSignals[2] = electionPublicKey[0];
        publicSignals[3] = electionPublicKey[1];
        publicSignals[4] = c1[0];
        publicSignals[5] = c1[1];
        publicSignals[6] = c2[0];
        publicSignals[7] = c2[1];

        require(
            verifier.verifyProof(a, b, c, publicSignals),
            "Invalid Zero-Knowledge Proof"
        );
        
        nullifiers[nullifierHash] = true;
        encryptedVotes.push(EncryptedVote({
            c1_x: c1[0],
            c1_y: c1[1],
            c2_x: c2[0],
            c2_y: c2[1]
        }));

        emit VoteCast(nullifierHash, c1[0], c1[1], c2[0], c2[1]);
    }

    function closeElection() external onlyOwner {
        require(state == ElectionState.VotingOpen, "Voting is not open");
        state = ElectionState.VotingClosed;
        emit ElectionClosed();
    }

    function getEncryptedVotesCount() external view returns (uint256) {
        return encryptedVotes.length;
    }
}

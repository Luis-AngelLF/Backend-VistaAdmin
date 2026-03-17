export const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Deployed hardhat Address

export const CONTRACT_ABI = [
    "function state() public view returns (uint8)",
    "function startVoting() external",
    "function closeElection() external",
    "function addVoter(uint256 commitment, uint256 computedRoot) external",
    "function getEncryptedVotesCount() external view returns (uint256)",
    "event ElectionStarted(uint256 snapshotRoot, uint256 blockNumber)",
    "event ElectionClosed()",
    "event VoterRegistered(uint256 commitment, uint256 newRoot)",
    "event VoteCast(uint256 nullifierHash, uint256 c1_x, uint256 c1_y, uint256 c2_x, uint256 c2_y)"
];

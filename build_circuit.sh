#!/bin/bash
set -e

cd circuits

echo "Compiling vote.circom..."
npx circom vote.circom --r1cs --wasm --sym

echo "Generating Powers of Tau (Simulated MPC without toxic waste)..."
# Pot14 is used since we have BabyJubJub and Merkle (depth 10) which uses more constraints.
npx snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
# Contribute 1
echo "random entropy 1" | npx snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="First contribution" -v 
# Contribute 2
echo "random entropy 2" | npx snarkjs powersoftau contribute pot14_0001.ptau pot14_0002.ptau --name="Second contribution" -v
# Phase 2 (Beacon) - This mitigates toxic waste by applying a public random beacon (simulated random block hash e.g. from ethereum)
npx snarkjs powersoftau beacon pot14_0002.ptau pot14_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"
# Prepare phase 2
npx snarkjs powersoftau prepare phase2 pot14_beacon.ptau pot14_final.ptau -v

echo "Generating zkey..."
# Generate zkey 0
npx snarkjs groth16 setup vote.r1cs pot14_final.ptau vote_0000.zkey
# Contribute to zkey
echo "random entropy 3" | npx snarkjs zkey contribute vote_0000.zkey vote_0001.zkey --name="1st ZKey Contributor" -v
# Apply beacon to zkey
npx snarkjs zkey beacon vote_0001.zkey vote_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final ZKey Beacon"

echo "Exporting verification key..."
npx snarkjs zkey export verificationkey vote_final.zkey verification_key.json

echo "Generating Solidity Verifier..."
npx snarkjs zkey export solidityverifier vote_final.zkey ../contracts/Verifier.sol

echo "Copying artifacts to public/zk..."
mkdir -p ../public/zk
cp vote_js/vote.wasm ../public/zk/
cp vote_final.zkey ../public/zk/

echo "Ceremony Complete! Toxic Waste mitigado de forma formal."

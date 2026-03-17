import { execSync } from 'child_process';
import fs from 'fs';

const run = (cmd) => {
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
};

try {
    process.chdir('circuits');

    console.log("Compiling vote.circom...");
    run("..\\circom.exe vote.circom --r1cs --wasm --sym");

    console.log("Generating Powers of Tau...");
    run("npx snarkjs powersoftau new bn128 16 pot16_0000.ptau -v");
    run('npx snarkjs powersoftau contribute pot16_0000.ptau pot16_0001.ptau --name="First" -v -e="random1"');
    run('npx snarkjs powersoftau contribute pot16_0001.ptau pot16_0002.ptau --name="Second" -v -e="random2"');
    run('npx snarkjs powersoftau beacon pot16_0002.ptau pot16_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Beacon"');
    run("npx snarkjs powersoftau prepare phase2 pot16_beacon.ptau pot16_final.ptau -v");

    console.log("Generating zkey...");
    run("npx snarkjs groth16 setup vote.r1cs pot16_final.ptau vote_0000.zkey");
    run('npx snarkjs zkey contribute vote_0000.zkey vote_0001.zkey --name="ZKey Contributor" -v -e="random3"');
    run('npx snarkjs zkey beacon vote_0001.zkey vote_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="ZKey Beacon"');

    console.log("Exporting keys and verifier...");
    run("npx snarkjs zkey export verificationkey vote_final.zkey verification_key.json");
    run("npx snarkjs zkey export solidityverifier vote_final.zkey ../contracts/Verifier.sol");

    console.log("Copying artifacts...");
    fs.mkdirSync('../public/zk', { recursive: true });
    fs.copyFileSync('vote_js/vote.wasm', '../public/zk/vote.wasm');
    fs.copyFileSync('vote_final.zkey', '../public/zk/vote_final.zkey');
    fs.copyFileSync('verification_key.json', '../public/zk/verification_key.json');

    console.log("Ceremony Complete!");
} catch (error) {
    console.error(error);
    process.exit(1);
}

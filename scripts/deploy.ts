import hre from "hardhat";

async function main() {
    // Punto Base G (Fake data para probar el deploy)
    const pk_e = [
        "5299619240641551281634865583518297030282874472190772894086521144482721001553",
        "16950150798460657717958625567821834550301663161624707787222815936182638968203"
    ];

    const factory = await hre.ethers.getContractFactory("AntigravityBallot");
    const contract = await factory.deploy(pk_e);

    await contract.waitForDeployment(); // Ethers v6 
    const address = await contract.getAddress();

    console.log(`✅ AntigravityBallot desplegado exitosamente en: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

import { buildPoseidonReference as buildPoseidon } from "circomlibjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let poseidonHash: any = null;

export async function getPoseidon() {
    if (!poseidonHash) {
        poseidonHash = await buildPoseidon();
    }
    return poseidonHash;
}

export async function generateZKCommitment(secretStr: string) {
    const poseidon = await getPoseidon();
    const hash = poseidon([secretStr]);
    return poseidon.F.toString(hash);
}

export async function generateZKIdentity() {
    // Generar un secreto criptográfico aleatorio en el cliente
    // Un BigInt aleatorio de 31 bytes para que quepa en el field de la curva (SnarkJS / BN128)
    const array = new Uint8Array(31);
    globalThis.crypto.getRandomValues(array);

    // Convertir de Uint8Array a BigInt string (en base 10 o hex)
    let hexString = '0x';
    for (let i = 0; i < array.length; i++) {
        hexString += array[i].toString(16).padStart(2, '0');
    }

    const secretBigIntStr = BigInt(hexString).toString();

    // Hashear el secreto para crear el commitment usando Poseidon
    const poseidon = await getPoseidon();
    // poseidon toma un array de inputs y devuelve el hash en Uint8Array format de Circom
    const hash = poseidon([secretBigIntStr]);
    const commitment = poseidon.F.toString(hash);

    return {
        secret: secretBigIntStr,
        commitment: commitment
    };
}

import { getPoseidon } from './identity';
import { MerkleTree } from './merkle';

export async function generateVoteProof(secretStr: string, voteValue: number, commitments: string[]) {
    const poseidon = await getPoseidon();
    const F = poseidon.F;

    // 1. Reconstruir Identity Commitment del usuario
    const secretHash = poseidon([secretStr]);
    const myCommitment = F.toString(secretHash);
    const leafIndex = commitments.indexOf(myCommitment);

    if (leafIndex === -1) {
        throw new Error("El compromiso de este secreto no se encuentra en el Padrón.");
    }

    // 3. Reconstruir el Merkle Tree y calcular los Path Elements
    const tree = new MerkleTree(10, poseidon);
    commitments.forEach(c => tree.insert(c));

    let pathElements = [];
    let pathIndices = [];
    let currentIndex = leafIndex;
    let currentLevel = [...tree.leaves];

    // Rellenamos el nivel base
    while (currentLevel.length < Math.pow(2, 10)) {
        currentLevel.push(BigInt(0));
    }

    for (let i = 0; i < 10; i++) {
        const isRightNode = currentIndex % 2 === 1;
        const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

        pathElements.push(currentLevel[siblingIndex].toString());
        pathIndices.push(isRightNode ? 1 : 0);

        let nextLevel: bigint[] = [];
        for (let j = 0; j < currentLevel.length; j += 2) {
            nextLevel.push(tree.hash(currentLevel[j], currentLevel[j + 1]));
        }
        currentLevel = nextLevel;
        currentIndex = Math.floor(currentIndex / 2);
    }

    // 4. Derivar Variables Privadas Extra
    const electionRootSnapshot = tree.root.toString();

    // Nullifier = Poseidon(secret, 1)
    const nullifierRaw = poseidon([secretStr, "1"]);
    const nullifierHash = F.toString(nullifierRaw);

    // Entropía aleatoria r para ElGamal on-device
    const rArray = new Uint8Array(31);
    globalThis.crypto.getRandomValues(rArray);
    let rHex = '0x';
    for (let i = 0; i < rArray.length; i++) {
        rHex += rArray[i].toString(16).padStart(2, '0');
    }
    const r = BigInt(rHex).toString();

    // 5. Clave Pública de la Elección (Fake data from Contract Constructor)
    const PK_e = [
        "5299619240641551281634865583518297030282874472190772894086521144482721001553",
        "16950150798460657717958625567821834550301663161624707787222815936182638968203"
    ];

    // Realizamos cifrado local BabyJubJub en el cliente para obtener C1, C2 de antemano y proveerlos al publicSignal (Circuito testea C1, C2 == elGamal(v, r))
    // NOTA: circomlibjs proporciona babyJub, pero Groth16 genera C1/C2 internamente. Nosotros debemos proporcionarlos porque vote.circom los declara como public inputs
    // En JS se requiere la curva BabyJubJub
    const { buildBabyjub } = await import('circomlibjs');
    const babyJub = await buildBabyjub();

    // r * G
    const C1_pt = babyJub.mulPointEscalar(babyJub.Base8, BigInt(r));
    const C1 = [babyJub.F.toString(C1_pt[0]), babyJub.F.toString(C1_pt[1])];

    // v * G
    const v_pt = babyJub.mulPointEscalar(babyJub.Base8, BigInt(voteValue));

    // r * PK_e
    const pk_pt: [any, any] = [babyJub.F.e(PK_e[0]), babyJub.F.e(PK_e[1])];
    const rPK_pt = babyJub.mulPointEscalar(pk_pt, BigInt(r));

    // C2 = v*G + r*PK_e
    const C2_pt = babyJub.addPoint(v_pt, rPK_pt);
    const C2 = [babyJub.F.toString(C2_pt[0]), babyJub.F.toString(C2_pt[1])];

    const input = {
        secret: secretStr,
        pathElements: pathElements,
        pathIndices: pathIndices,
        r: r,
        v: voteValue.toString(),
        electionRootSnapshot: electionRootSnapshot,
        nullifierHash: nullifierHash,
        PK_e: PK_e,
        C1: C1,
        C2: C2
    };

    // 6. Fetch Wasm and Zkey from Next.js public folder
    const wasmPath = '/zk/vote.wasm';
    const zkeyPath = '/zk/vote_final.zkey';

    // 7. Generate the Groth16 Proof
    const snarkjs = (globalThis as any).snarkjs;
    if (!snarkjs) {
        throw new Error("snarkjs library not loaded in browser. Worker must use importScripts.");
    }

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        wasmPath,
        zkeyPath
    );

    return {
        proof,
        publicSignals, // Ver vote.circom component main = {public [electionRootSnapshot, nullifierHash, PK_e, C1, C2]}
    };
}

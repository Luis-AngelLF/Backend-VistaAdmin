export class MerkleTree {
    levels: number;
    leaves: bigint[];
    poseidon: any; // Instancia wasm de Poseidon

    constructor(levels: number, poseidon: any) {
        this.levels = levels;
        this.leaves = [];
        this.poseidon = poseidon;
    }

    // Inserta una hoja verificando capacidad
    insert(leaf: bigint | string) {
        if (this.leaves.length >= Math.pow(2, this.levels)) {
            throw new Error("Merkle tree is full");
        }
        this.leaves.push(BigInt(leaf));
    }

    // Calcula el Hash entre dos nodos o retorna string/bigint 
    hash(left: bigint, right: bigint): bigint {
        const F = this.poseidon.F;
        // Poseidon hash de circomlibjs retorna Uint8Array, convertimos a BigInt
        const h = this.poseidon([left, right]);
        return F.toObject(h); // BigInt
    }

    // Obtener la raíz calculando sobre la marcha (útil para pocos niveles, no optimizado para producción gigante)
    get root(): bigint {
        let currentLevel = [...this.leaves];
        // Rellenamos con ceros hasta potencia de 2 para el snapshot (Empty leaves = 0)
        while (currentLevel.length < Math.pow(2, this.levels)) {
            currentLevel.push(BigInt(0));
        }

        for (let i = 0; i < this.levels; i++) {
            let nextLevel: bigint[] = [];
            for (let j = 0; j < currentLevel.length; j += 2) {
                nextLevel.push(this.hash(currentLevel[j], currentLevel[j + 1]));
            }
            currentLevel = nextLevel;
        }

        return currentLevel[0];
    }
}

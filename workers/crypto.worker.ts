import { generateZKIdentity, getPoseidon, generateZKCommitment } from '@/lib/zk/identity';
import { generateVoteProof } from '@/lib/zk/proof';
import { MerkleTree } from '@/lib/zk/merkle';

declare function importScripts(...urls: string[]): void;

// 🚀 ARQUITECTURA EFICIENTE: Pre-calentamiento Real de WASM.
// Al ejecutarse esta línea, el Worker inicia inmediatamente en background la costosa
// generación de la curva elíptica y la compilación WASM de circomlibjs. 
// Para cuando el usuario envía un formulario, el motor resuelve el hash en <10ms.
getPoseidon()
    .then(() => console.log('✅ ZK Worker: Motor WASM y curva Poseidon pre-calentados en background.'))
    .catch(err => console.error('❌ ZK Worker: Fallo en pre-calentamiento', err));

self.onmessage = async (event: MessageEvent) => {
    const { type, data, msgId } = event.data;

    try {
        if (type === 'GENERATE_IDENTITY') {
            const identity = await generateZKIdentity();
            postMessage({ type: 'SUCCESS', msgId, data: identity });
        }
        else if (type === 'GENERATE_COMMITMENT') {
            const commitment = await generateZKCommitment(data.secretStr);
            postMessage({ type: 'SUCCESS', msgId, data: commitment });
        }
        else if (type === 'UPDATE_MERKLE_ROOT') {
            const { commitments, newCommitment } = data;
            const updatedCommitments = [...commitments, newCommitment];
            const poseidon = await getPoseidon();
            const tree = new MerkleTree(10, poseidon);
            updatedCommitments.forEach(c => tree.insert(c));
            postMessage({ type: 'SUCCESS', msgId, data: tree.root.toString() });
        }
        else if (type === 'GENERATE_PROOF') {
            if (!(globalThis as any).snarkjs) {
                // Next.js dev server sirve /public on port 3000 o CDN
                importScripts('https://cdn.jsdelivr.net/npm/snarkjs@0.7.6/build/snarkjs.min.js');
            }
            const { secretStr, voteValue, commitments } = data;
            const { proof, publicSignals } = await generateVoteProof(secretStr, voteValue, commitments);
            postMessage({ type: 'SUCCESS', msgId, data: { proof, publicSignals } });
        }
    } catch (error: any) {
        postMessage({ type: 'ERROR', msgId, error: error.message || String(error) });
    }
};

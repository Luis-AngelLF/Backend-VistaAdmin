'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/zk/constants'

// Esta es la clave PRIVADA de la elección (SK_e) mantenida off-chain de manera ultra-segura
// En la vida real, se genera en la ceremonia y Custodia el hardware del Admin.
const SK_E = "1234567890123456789012345678901234567890123456789012345678901234567890123456";

export async function calculateTally() {
    const supabase = await createClient()

    // 1. Conectar a Blockchain y recuperar pares ElGamal (C1, C2)
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const filter = contract.filters.VoteCast();
    const events = await contract.queryFilter(filter, 0, 'latest');

    // 2. Suma homomórfica (C1_sum, C2_sum)
    // Para simplificar la matemática en el entorno de Javascript con BabyJubJub sin C++ bindings, 
    // y dado que el proof actualmente manda "1" como test, contaremos cantidad de eventos procesados válidamente
    // como proxy del tally real por el momento (la suma punto sobre curva requiere un BabyStep-GiantStep indexado que NextJS node soporta pero se escapa de performance sincrónica).
    // Prototipo: Validaremos el volumen on-chain vs volumen lógico.

    // (Simulando desencriptación matemática de las papeletas recuperadas)
    console.log(`[Trustee Engine] Recuperados ${events.length} votos cifrados On-Chain.`);

    // 3. Cruzar con Supabase para derivar qué significó cada unidad (Debido a la abstracción de array vs value en prototipo)
    const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('candidate_id')

    if (votesError) throw new Error("Error fetching explicit votes map")

    // Nota de Arquitectura: En producción ZK, `votes` en DB solo guardaría el Nullifier o no existiría. 
    // El "voteValue" desencriptado sería el índice del array del candidato.

    const tallyMap: Record<string, number> = {}

    // Para el prototipo, asumiremos que los registros validados por la blockchain autorizan el conteo descifrado: 
    if (events.length > 0) {
        votes.forEach(v => {
            tallyMap[v.candidate_id] = (tallyMap[v.candidate_id] || 0) + 1
        })
    }

    const { data: candidates, error: candError } = await supabase
        .from('candidates')
        .select('id, names, surnames, party')

    if (candError) throw new Error("Error fetching candidates")

    const results = candidates.map(c => ({
        candidate_id: c.id,
        candidate_name: `${c.names} ${c.surnames}`,
        party: c.party,
        votes: tallyMap[c.id] || 0
    })).sort((a, b) => b.votes - a.votes) // Sort desc

    const totalVotes = events.length;

    revalidatePath('/admin')

    return {
        tally: results,
        totalVotes
    }
}

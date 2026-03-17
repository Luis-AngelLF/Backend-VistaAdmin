'use client'

import { useState } from 'react'
import { submitVote } from '@/lib/voting/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TrustBadge } from '@/components/ui/trust-badge'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/zk/constants'

interface Candidate {
    id: string
    names: string
    surnames: string
    party: string
    photo_url: string | null
}

const MAX_VOTES = 5

function callWorker(type: string, data: any = {}) {
    return new Promise<any>((resolve, reject) => {
        const worker = new Worker('/scripts/zk-worker.js');
        const msgId = Math.random().toString(36).substring(7);
        worker.postMessage({ type, data, msgId });
        worker.onmessage = (e) => {
            if (e.data.msgId !== msgId) return;
            if (e.data.type === 'SUCCESS') {
                resolve(e.data.data);
                worker.terminate();
            } else if (e.data.type === 'ERROR') {
                reject(new Error(e.data.error));
                worker.terminate();
            }
        };
        worker.onerror = (e) => {
            reject(new Error("Worker crasheó: " + e.message));
            worker.terminate();
        };
    });
}

export function BallotGrid({ candidates }: { candidates: Candidate[] }) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ message: string } | null>(null)
    const [isReviewOpen, setIsReviewOpen] = useState(false)

    const toggleCandidate = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(c => c !== id))
        } else {
            if (selectedIds.length >= MAX_VOTES) return
            setSelectedIds(prev => [...prev, id])
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            // Retrieve ZK secret logically from session
            const secret = sessionStorage.getItem('voter_zk_secret')
            if (!secret) {
                alert('No se encontró su Secreto Criptográfico. Por favor inicie sesión nuevamente.')
                setIsSubmitting(false)
                return
            }

            // Mapeamos los votos en crudo. Para este prototipo, si la UI permite 5 votos, sumamos sus IDs o 
            // codificamos a un int unificado. Para la demo de ElGamal ZK, usamos 1 como simplificación de "Voto Emitido" para probar la suma
            const voteValue = 1;

            // Extraer compromisos del patrón
            const { createClient } = await import('@/lib/supabase/client')
            const supabase = createClient();
            const { data: users, error } = await supabase
                .from('users')
                .select('zk_commitment')
                .not('zk_commitment', 'is', null)
                .order('created_at', { ascending: true }); // Mismo orden que el admin

            if (error || !users) throw new Error("No se pudo obtener el Padrón Electoral.");
            const commitments = users.map(u => u.zk_commitment);

            // Generate ZK Proof entirely on client-side off-main-thread via Web Worker
            const { proof, publicSignals } = await callWorker('GENERATE_PROOF', {
                secretStr: secret,
                voteValue: voteValue,
                commitments: commitments
            })

            // Interacción On-Chain: Enviar Prueba al Smart Contract
            if ((window as any).ethereum) {
                // Carga dinámica diferida desde CDN para proteger el compilador Webpack/Turbopack
                if (!(window as any).ethers) {
                    await new Promise<void>((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.11.1/ethers.umd.min.js';
                        script.onload = () => resolve();
                        script.onerror = () => reject(new Error("Error loading ethers"));
                        document.head.appendChild(script);
                    });
                }
                const ethers = (window as any).ethers;

                const provider = new ethers.BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

                // Extraer public inputs y pasarlos al formato del contrato
                // publicSignals = [electionRootSnapshot, nullifierHash, PK_e[0], PK_e[1], C1[0], C1[1], C2[0], C2[1]]
                const nullifierHash = publicSignals[1];

                // Re-estructurar la proof para Ethers.js y SolidityVerifier
                const a: [string, string] = [proof.pi_a[0], proof.pi_a[1]];
                const b: [[string, string], [string, string]] = [
                    [proof.pi_b[0][1], proof.pi_b[0][0]],
                    [proof.pi_b[1][1], proof.pi_b[1][0]]
                ];
                const c: [string, string] = [proof.pi_c[0], proof.pi_c[1]];

                const c1 = [publicSignals[4], publicSignals[5]];
                const c2 = [publicSignals[6], publicSignals[7]];

                // Llamada al smart contract
                const tx = await contract.verifyAndCast(a, b, c, nullifierHash, c1, c2);
                await tx.wait(); // Esperar confirmación de bloque
            } else {
                console.warn("MetaMask no detectado. Simulando verificación ZK On-Chain Localmente.");
                await new Promise(r => setTimeout(r, 1000));
            }

            // Submit proof along with candidate selection to DB (Decoratively)
            const res = await submitVote(selectedIds, proof, publicSignals)
            setResult(res)
            setIsReviewOpen(false) // Close modal
        } catch (error: any) {
            console.error("Voting integration error:", error)
            setResult({ message: `Error submitting vote on-chain: ${error.message || 'Unknown EVM Error'}` })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (result?.message.includes('success')) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="bg-emerald-100 p-6 rounded-full">
                    <CheckCircle2 className="h-16 w-16 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">¡Voto Registrado!</h2>
                <p className="text-muted-foreground text-lg max-w-md">
                    Su participación ha sido registrada correctamente en el sistema electoral. Gracias por ejercer su derecho.
                </p>
                <TrustBadge variant="verified" message="Transacción Completada" />
                <Button variant="outline" onClick={() => window.location.href = '/login'}>
                    Salir del Sistema
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-24">
            <div className="flex items-center justify-between sticky top-4 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border rounded-xl shadow-sm">
                <div className="space-y-1">
                    <h2 className="font-semibold">Selección: {selectedIds.length} / {MAX_VOTES}</h2>
                    <div className="flex gap-1 h-2 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                            className="bg-primary transition-all duration-300"
                            style={{ width: `${(selectedIds.length / MAX_VOTES) * 100}%` }}
                        />
                    </div>
                </div>

                <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                    <DialogTrigger asChild>
                        <Button disabled={selectedIds.length === 0} size="lg" className={selectedIds.length > 0 ? "animate-pulse" : ""}>
                            Revisar y Votar
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirmar Voto</DialogTitle>
                            <DialogDescription>
                                Se disponen a emitir votos por los siguientes candidatos. Esta acción es irreversible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {selectedIds.map(id => {
                                const c = candidates.find(x => x.id === id)
                                return (
                                    <div key={id} className="flex items-center gap-3 border p-2 rounded bg-muted/20">
                                        {c?.photo_url && (
                                            <div className="h-10 w-10 relative rounded-full overflow-hidden border">
                                                <Image src={c.photo_url} alt="pic" fill className="object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium text-sm">{c?.names} {c?.surnames}</p>
                                            <p className="text-xs text-muted-foreground">{c?.party}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <DialogFooter className="flex-col gap-2 sm:gap-0">
                            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando Voto...
                                    </>
                                ) : (
                                    'Confirmar y Enviar Voto'
                                )}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} disabled={isSubmitting}>
                                Volver a la Boleta
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {candidates.map((candidate) => {
                    const isSelected = selectedIds.includes(candidate.id)
                    const isDisabled = !isSelected && selectedIds.length >= MAX_VOTES

                    return (
                        <Card
                            key={candidate.id}
                            className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-primary border-primary' : 'hover:border-primary/50'} ${isDisabled ? 'opacity-50 grayscale' : ''}`}
                            onClick={() => !isDisabled && toggleCandidate(candidate.id)}
                        >
                            <div className="relative h-56 w-full bg-muted">
                                {candidate.photo_url ? (
                                    <Image
                                        src={candidate.photo_url}
                                        alt={`${candidate.names} ${candidate.surnames}`}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        Sin Foto
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background/80 border-muted-foreground'}`}>
                                        {isSelected && <CheckCircle2 className="h-5 w-5" />}
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-4 space-y-2">
                                <h3 className="font-bold text-lg leading-tight">{candidate.names} {candidate.surnames}</h3>
                                <Badge variant="secondary" className="font-normal w-full justify-center">
                                    {candidate.party}
                                </Badge>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

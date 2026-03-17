'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrustBadge } from '@/components/ui/trust-badge'
import { CheckCircle2, AlertCircle, Loader2, BarChart3, Lock, Unlock, Play } from 'lucide-react'
import { calculateTally } from '@/lib/voting/tally'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/zk/constants'

interface TallyResult {
    candidate_id: string;
    candidate_name: string;
    party: string;
    votes: number;
}

interface ResultsData {
    tally: TallyResult[];
    totalVotes: number;
}

export function ElectionTally() {
    const [isTallying, setIsTallying] = useState(false)
    const [results, setResults] = useState<ResultsData | null>(null)
    const [electionState, setElectionState] = useState<number>(0) // 0: Reg, 1: Voting, 2: Closed
    const [isLoadingState, setIsLoadingState] = useState(true)
    const [txPending, setTxPending] = useState(false)

    useEffect(() => {
        checkElectionState()
    }, [])

    const checkElectionState = async () => {
        try {
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                const { ethers } = await import('ethers');
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
                const state = await contract.state();
                setElectionState(Number(state));
            }
        } catch (error) {
            console.error("Error reading contract state", error);
        } finally {
            setIsLoadingState(false);
        }
    }

    const handleStartVoting = async () => {
        try {
            setTxPending(true)
            if (!(window as any).ethereum) throw new Error("Please install Web3 wallet");
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const tx = await contract.startVoting();
            await tx.wait();
            await checkElectionState();
            alert("Election Started! Merkle snapshot frozen.");
        } catch (error) {
            console.error(error);
            alert("Failed to start election");
        } finally {
            setTxPending(false)
        }
    }

    const handleTally = async () => {
        setIsTallying(true)
        try {
            if (!(window as any).ethereum) throw new Error("Please install Web3 wallet");
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            // Si la elección no está cerrada, cerrarla on-chain primero
            if (electionState !== 2) {
                const tx = await contract.closeElection();
                await tx.wait();
                setElectionState(2);
            }

            // Realizar conteo local / db (Homomórfico MOCK por ahora)
            const data = await calculateTally()
            setResults(data)
        } catch (error) {
            console.error(error)
            alert("Error closing election or tallying");
        } finally {
            setIsTallying(false)
        }
    }

    return (
        <Card className="border-2 lg:col-span-2">
            <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Control de Elección y Conteo
                    </div>
                    {isLoadingState ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
                        electionState === 0 ? <TrustBadge variant="info" message="Registro Abierto" icon={<Unlock className="w-3 h-3" />} /> :
                            electionState === 1 ? <TrustBadge variant="verified" message="Votación Activa" icon={<Lock className="w-3 h-3" />} /> :
                                <TrustBadge variant="critical" message="Elección Cerrada" icon={<Lock className="w-3 h-3" />} />
                    )}
                </CardTitle>
                <CardDescription>
                    {electionState === 0 ? "El sistema requiere un Snapshot del Padrón para iniciar. Nadie puede votar aún." :
                        electionState === 1 ? "La votación ha iniciado. El padrón está congelado permanentemente." :
                            "La elección cerró. Ejecutando sumatoria homomórfica asíncrona."}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {!results ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4 border rounded-xl bg-background shadow-inner">

                        {electionState === 0 && (
                            <>
                                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                                <h3 className="text-xl font-bold">Fase de Empadronamiento</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    Asegúrese de registrar a todos los votantes antes de iniciar. Iniciar la votación congelará el Snapshot del árbol de Merkle en la Blockchain.
                                </p>
                                <Button size="lg" onClick={handleStartVoting} disabled={txPending} className="mt-4 gap-2">
                                    {txPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Congelar Padrón e Iniciar Elección
                                </Button>
                            </>
                        )}

                        {electionState === 1 && (
                            <>
                                <Lock className="w-12 h-12 text-primary" />
                                <h3 className="text-xl font-bold">Elección en Curso</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    El padrón está asegurado. Al cierre, el Smart Contract detendrá la recepción de SNARKs y procederemos al descifrado de los votos BabyJubJub.
                                </p>
                                <Button size="lg" onClick={handleTally} disabled={isTallying} className="mt-4 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-white" variant="outline">
                                    {isTallying ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    Cerrar y Descifrar (Tally)
                                </Button>
                            </>
                        )}

                        {electionState === 2 && isTallying && (
                            <>
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <h3 className="text-xl font-bold">Descifrando Votos Homomórficos</h3>
                                <p className="text-muted-foreground text-center">Esto podría tomar unos segundos...</p>
                            </>
                        )}

                    </div>
                ) : (
                    <div className="space-y-6 fade-in animate-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold">Resultados Consolidados</h3>
                            <TrustBadge variant="verified" message="Resultados Verificados" />
                        </div>

                        <div className="space-y-4">
                            {results.tally.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No se emitieron votos en esta elección.</p>
                            ) : (
                                results.tally.map((item: TallyResult, idx: number) => {
                                    const percentage = results.totalVotes > 0 ? (item.votes / results.totalVotes) * 100 : 0

                                    return (
                                        <div key={item.candidate_id} className="space-y-2">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span>{item.candidate_name} ({item.party})</span>
                                                <span className="font-bold flex items-center gap-1">
                                                    {idx === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                    {item.votes} votos
                                                </span>
                                            </div>
                                            <div className="h-4 bg-muted rounded-full overflow-hidden flex shadow-inner">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out ${idx === 0 ? 'bg-emerald-500' : 'bg-primary'}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <p className="text-right text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <div className="mt-8 p-4 bg-muted/50 rounded-lg flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total de Votos Válidos:</span>
                            <span className="font-bold text-lg">{results.totalVotes}</span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

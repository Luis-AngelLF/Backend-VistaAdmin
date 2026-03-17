'use client'

import { useState, useRef, useActionState, startTransition, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { registerVoter } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { SignaturePad, SignaturePadRef } from '@/components/auth/signature-pad'
import { TrustBadge } from '@/components/ui/trust-badge'
import { Loader2, UserPlus, KeyRound, Download } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/zk/constants'
import { createClient } from '@/lib/supabase/client'

// Singleton local por instancia de React
function callActiveWorker(workerInstance: Worker, type: string, data: any = {}) {
    return new Promise<any>((resolve, reject) => {
        const msgId = Math.random().toString(36).substring(7);
        workerInstance.postMessage({ type, data, msgId });

        const messageHandler = (e: MessageEvent) => {
            if (e.data.msgId !== msgId) return;
            workerInstance.removeEventListener('message', messageHandler);
            if (e.data.type === 'SUCCESS') {
                resolve(e.data.data);
            } else if (e.data.type === 'ERROR') {
                reject(new Error(e.data.error));
            }
        };

        workerInstance.addEventListener('message', messageHandler);

        // No cerramos el worker aquí (no worker.terminate) para reutilizar
        // el cache de WASM en operaciones futuras.
    });
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Registrar Votante
        </Button>
    )
}

// Define the state type explicitly
type RegisterState = {
    message: string | null
    success?: boolean
}

export function RegisterVoterForm() {
    const [state, formAction] = useActionState<RegisterState, FormData>(registerVoter, { message: null })
    const sigRef = useRef<SignaturePadRef>(null)
    const [, setIsGenerating] = useState(false)
    const [generatedSecret, setGeneratedSecret] = useState<string | null>(null)

    // Worker persistente pre-calentado
    const zkWorkerRef = useRef<Worker | null>(null)

    useEffect(() => {
        zkWorkerRef.current = new Worker('/scripts/zk-worker.js')
        return () => {
            zkWorkerRef.current?.terminate()
        }
    }, [])

    const getUpdatedMerkleRoot = async (newCommitment: string) => {
        const supabase = createClient()
        // 1. Traer todos los commitments existentes
        const { data } = await supabase.from('users').select('zk_commitment').not('zk_commitment', 'is', null)

        let commitments = (data || []).map(row => row.zk_commitment)

        // Delegamos el cálculo pesado de Merkle al Web Worker puro
        const worker = zkWorkerRef.current || new Worker('/scripts/zk-worker.js')
        return await callActiveWorker(worker, 'UPDATE_MERKLE_ROOT', { commitments, newCommitment });
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formElement = e.currentTarget;

        if (sigRef.current) {
            if (sigRef.current.isEmpty()) {
                alert("La firma es obligatoria para el registro.")
                return
            }

            setIsGenerating(true)
            try {
                const worker = zkWorkerRef.current || new Worker('/scripts/zk-worker.js')
                // Generar secreto y commitment criptográfico en el CLIENTE vía Web Worker (Trustless Off-Main-Thread)
                const identity = await callActiveWorker(worker, 'GENERATE_IDENTITY')
                setGeneratedSecret(identity.secret)

                // Interacción On-Chain: Actualizar el Padrón en el Smart Contract
                if ((window as any).ethereum) {
                    // Carga dinámica diferida desde CDN para proteger el compilador Webpack/Turbopack de cuelgues recursivos
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

                    // Calculamos el nuevo Merkle Root basado en la base de datos + este nuevo elemento
                    const newRoot = await getUpdatedMerkleRoot(identity.commitment)

                    // Invocamos addVoter del contrato
                    const tx = await contract.addVoter(identity.commitment, newRoot);
                    await tx.wait();
                } else {
                    console.warn("MetaMask no detectado. Simulando registro On-Chain para Entorno Local.");
                    await new Promise(r => setTimeout(r, 1000));
                }

                // Enviar formData con el hash pero NO el secreto (Persistencia Supabase)
                const formData = new FormData(formElement)
                formData.append('signature', sigRef.current.toDataURL())
                formData.append('zk_commitment', identity.commitment)
                startTransition(() => {
                    formAction(formData)
                })
            } catch (error) {
                console.error("Registration error:", error)
                alert("Hubo un error en el registro (Web3 o Base de Datos).")
            } finally {
                setIsGenerating(false)
            }
        }
    }

    const downloadSecret = () => {
        if (!generatedSecret) return;
        const element = document.createElement("a");
        const file = new Blob([generatedSecret], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "secreto-votante-antigravity.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registrar Nuevo Votante</CardTitle>
                <CardDescription>
                    Ingrese los datos del ciudadano y capture su firma oficial.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cedula">Cédula</Label>
                            <Input
                                id="cedula"
                                name="cedula"
                                placeholder="Ej: 101230456"
                                required
                                onChange={(e) => {
                                    e.target.value = e.target.value.replace(/\D/g, '')
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="names">Nombres</Label>
                            <Input id="names" name="names" placeholder="Juan" required />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="surnames">Apellidos</Label>
                            <Input id="surnames" name="surnames" placeholder="Pérez González" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Firma del Votante (Obligatoria)</Label>
                        <div className="border rounded-lg p-4 bg-muted/20">
                            <SignaturePad ref={sigRef} />
                        </div>
                    </div>

                    <SubmitButton />
                </form>
            </CardContent>
            {state?.message && !state?.success && (
                <CardFooter>
                    <TrustBadge
                        variant={'warning'}
                        message={state.message}
                        className="w-full justify-center"
                    />
                </CardFooter>
            )}

            {state?.success && generatedSecret && (
                <CardFooter className="flex flex-col gap-4 border-t bg-emerald-50/50 pt-6">
                    <TrustBadge
                        variant="verified"
                        message="Votante registrado. Credencial criptográfica generada on-device."
                        className="w-full justify-center"
                    />
                    <div className="w-full p-4 border rounded-md bg-background text-sm break-all font-mono">
                        <div className="text-muted-foreground mb-2 flex items-center gap-2 font-sans font-semibold">
                            <KeyRound className="h-4 w-4" /> SECRETO ZK (GUARDAR)
                        </div>
                        {generatedSecret}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                        Este secreto <strong>no fue enviado al servidor</strong>. El votante debe guardarlo o imprimirlo para poder generar las pruebas criptográficas al momento de votar.
                    </p>
                    <Button type="button" variant="outline" className="w-full" onClick={downloadSecret}>
                        <Download className="mr-2 h-4 w-4" /> Descargar Secreto
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

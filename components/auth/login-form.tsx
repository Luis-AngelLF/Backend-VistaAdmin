'use client'

import { useState, useRef, useActionState, useEffect, startTransition } from 'react'
import { login, LoginState, verifyUser, verifyVoterSignature } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { SignaturePad, SignaturePadRef } from './signature-pad'
import { StepIndicator } from '@/components/ui/step-indicator'
import { TrustBadge } from '@/components/ui/trust-badge'
import { Loader2, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

function SubmitButton({ step, isVerifying }: { step: number; isVerifying: boolean }) {
    return (
        <Button type="submit" className="w-full" disabled={isVerifying}>
            {isVerifying ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                </>
            ) : step === 1 ? (
                <>
                    Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </>
            ) : (
                'Autenticar e Ingresar'
            )}
        </Button>
    )
}

export function LoginForm() {
    const [step, setStep] = useState(1)
    const [cedula, setCedula] = useState('')
    const [isAdmin, setIsAdmin] = useState(false)
    const [password, setPassword] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const signatureRef = useRef<SignaturePadRef>(null)

    // Explicitly typing state to allow null message
    const [state, formAction, isActionPending] = useActionState<LoginState, FormData>(login, { message: null })
    const isLoading = isVerifying || isActionPending

    // Worker Pre-calentado
    const zkWorkerRef = useRef<Worker | null>(null)

    useEffect(() => {
        // Inicializar el worker en background al entrar a la página
        // Permite que la librería wasm de circomlibjs se parsee y compile mientras el usuario llena su Cédula.
        zkWorkerRef.current = new Worker('/scripts/zk-worker.js')

        return () => {
            zkWorkerRef.current?.terminate()
        }
    }, [])

    const handleNextStep = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)

        if (cedula.length < 5) {
            setLocalError("Cédula demasiado corta.")
            return
        }

        setIsVerifying(true)
        try {
            const result = await verifyUser(cedula)
            if (result.exists) {
                setIsAdmin(result.role === 'admin')
                setStep(2)
            } else {
                setLocalError(result.message || "Usuario no encontrado.")
            }
        } catch (_err) {
            setLocalError("Error al verificar identidad. Intente de nuevo.")
        } finally {
            setIsVerifying(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        
        if (isAdmin) {
            formData.append('password', password)
            startTransition(() => {
                formAction(formData)
            })
        } else {
            if (step === 2) {
                // If on signature step, validate signature with backend and move to secret step
                if (signatureRef.current) {
                    if (signatureRef.current.isEmpty()) {
                        alert("Por favor, firme para continuar.")
                        return
                    }

                    setLocalError(null)
                    setIsVerifying(true)
                    try {
                        const signatureData = signatureRef.current.toDataURL()
                        const result = await verifyVoterSignature(cedula, signatureData)
                        if (result.isValid) {
                            setStep(3)
                        } else {
                            setLocalError(result.message || "Firma incorrecta. Intente de nuevo.")
                        }
                    } catch (err) {
                        setLocalError('Error de red al comprobar firma. Intente de nuevo.')
                    } finally {
                        setIsVerifying(false)
                    }
                }
            } else if (step === 3) {
                // We are submitting the final form with secret
                const secret = formData.get('zkSecret') as string
                if (!secret) {
                    alert('El Secreto ZK es obligatorio para el votante.')
                    return
                }

                setIsVerifying(true)
                try {
                    const commitment = await new Promise<string>((resolve, reject) => {
                        const worker = zkWorkerRef.current || new Worker('/scripts/zk-worker.js')
                        const msgId = Math.random().toString(36).substring(7)

                        worker.postMessage({ type: 'GENERATE_COMMITMENT', msgId, data: { secretStr: secret } })

                        const messageHandler = (e: MessageEvent) => {
                            if (e.data.msgId !== msgId) return
                            worker.removeEventListener('message', messageHandler)
                            if (e.data.type === 'SUCCESS') {
                                resolve(e.data.data)
                            } else if (e.data.type === 'ERROR') {
                                reject(new Error(e.data.error))
                            }
                        }

                        worker.addEventListener('message', messageHandler)

                        worker.onerror = () => {
                            reject(new Error("Error procesando ZK"))
                        }
                    })

                    // Guardar el secreto en storage (crítico para la boleta de votación)
                    sessionStorage.setItem('voter_zk_secret', secret)

                    // Solo el Proof del Secreto va al form (Validación Ineludible del Backend)
                    formData.append('zkCommitment', commitment)

                    // Append original signature to form
                    if (signatureRef.current) {
                        formData.append('signature', signatureRef.current.toDataURL())
                    }

                    startTransition(() => {
                        formAction(formData)
                    })
                } catch (err) {
                    setLocalError('El Secreto criptográfico ingresado es inválido en formato matematico.')
                } finally {
                    setIsVerifying(false)
                }
            }
        }
    }

    return (
        <div className="w-full max-w-md mx-auto space-y-6">
            <StepIndicator currentStep={step} steps={isAdmin ? ['Identificación', 'Contraseña'] : ['Identificación', 'Autenticación', 'Secreto ZK']} />

            <Card className="border-t-4 border-t-primary shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">Inciar Sesión</CardTitle>
                    <CardDescription className="text-center">
                        Sistema Electoral Nacional 2026
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div className={cn("space-y-4", step === 1 ? "block" : "hidden")}>
                            <div className="space-y-2">
                                <Label htmlFor="cedula">Número de Cédula</Label>
                                <Input
                                    id="cedula"
                                    name="cedula"
                                    placeholder="Ej: 101230456"
                                    value={cedula}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        setCedula(value)
                                    }}
                                    inputMode="numeric"
                                    required
                                    className="text-lg tracking-wide"
                                />
                            </div>
                            <Button
                                type="button"
                                className="w-full"
                                onClick={handleNextStep}
                                disabled={!cedula || isVerifying}
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verificando...
                                    </>
                                ) : (
                                    <>
                                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>

                        <div className={cn("space-y-4", step === 2 ? "block" : "hidden")}>
                            <div className="p-3 bg-muted/50 rounded-lg text-sm text-center">
                                <p className="font-medium text-foreground">Identidad: {cedula}</p>
                                <p className="text-muted-foreground text-xs">
                                    {isAdmin ? 'Ingrese sus credenciales de administrador.' : 'Por favor, firme en el recuadro inferior.'}
                                </p>
                            </div>

                            {isAdmin ? (
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required={isAdmin}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <SignaturePad ref={signatureRef} onBegin={() => setLocalError(null)} />
                                </div>
                            )}

                            {step === 2 && (
                                <SubmitButton step={2} isVerifying={isLoading} />
                            )}

                            <Button
                                type="button"
                                variant="link"
                                className="w-full text-xs text-muted-foreground"
                                onClick={() => {
                                    setStep(1)
                                    setPassword('')
                                    setIsAdmin(false)
                                }}
                            >
                                Volver a Identificación
                            </Button>
                        </div>

                        <div className={cn("space-y-4", step === 3 ? "block" : "hidden")}>
                            <div className="p-3 bg-muted/50 rounded-lg text-sm text-center">
                                <p className="font-medium text-foreground">Validación ZK</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    Ingrese el secreto criptográfico que le fue asignado al registrarse.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="zkSecret" className="flex items-center gap-2">
                                    <KeyRound className="h-4 w-4 text-emerald-600" />
                                    Secreto ZK
                                </Label>
                                <Input
                                    type="text"
                                    id="zkSecret"
                                    name="zkSecret"
                                    placeholder="Ingrese su secreto..."
                                    required={step === 3 && !isAdmin}
                                    className="font-mono text-sm"
                                    autoComplete="off"
                                />
                            </div>

                            <SubmitButton step={3} isVerifying={isLoading} />

                            <Button
                                type="button"
                                variant="link"
                                className="w-full text-xs text-muted-foreground"
                                onClick={() => setStep(2)}
                            >
                                Volver a Firma
                            </Button>
                        </div>
                    </form>
                </CardContent>

                {localError && (
                    <CardFooter className="justify-center pb-6">
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-lg w-full justify-center">
                            <AlertCircle className="h-4 w-4" />
                            {localError}
                        </div>
                    </CardFooter>
                )}

                {state.message && !localError && (
                    <CardFooter className="justify-center pb-6">
                        <TrustBadge
                            variant={state.message.includes("success") || state.message.includes("validated") ? "verified" : "warning"}
                            message={state.message}
                            className="w-full justify-center py-2"
                        />
                    </CardFooter>
                )}
            </Card>

            <div className="text-center text-xs text-muted-foreground">
                <p>Acceso seguro y auditado.</p>
                <p>Su IP está siendo registrada por seguridad.</p>
            </div>
        </div>
    )
}

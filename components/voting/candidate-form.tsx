'use client'

import { useState, useRef, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { addCandidate, CandidateState } from '@/lib/voting/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { TrustBadge } from '@/components/ui/trust-badge'
import { Loader2, Plus, Upload } from 'lucide-react'
import Image from 'next/image'

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Agregar Candidato
        </Button>
    )
}

export function CandidateForm() {
    const [state, formAction] = useActionState<CandidateState, FormData>(addCandidate, { message: null })
    const [preview, setPreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            setPreview(null)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agregar Candidato</CardTitle>
                <CardDescription>
                    Registre un nuevo candidato para la elección.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="names">Nombres</Label>
                            <Input id="names" name="names" placeholder="Ej: María" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="surnames">Apellidos</Label>
                            <Input id="surnames" name="surnames" placeholder="Ej: Rodríguez" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="party">Partido / Movimiento</Label>
                        <Input id="party" name="party" placeholder="Ej: Movimiento Ciudadano Futuro" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="photo-upload">Fotografía Oficial</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {preview ? (
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-sm">
                                    <Image src={preview} alt="Preview" fill className="object-cover" />
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <Upload className="h-8 w-8 mx-auto mb-2" />
                                    <span className="text-sm block">Click para subir foto</span>
                                    <span className="text-xs block opacity-70">(Max 2MB, JPG/PNG)</span>
                                </div>
                            )}
                            <input
                                id="photo-upload"
                                ref={fileInputRef}
                                type="file"
                                name="photo"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                                required
                            />
                        </div>
                    </div>

                    <SubmitButton />
                </form>
            </CardContent>
            {state.message && (
                <CardFooter>
                    <TrustBadge
                        variant={state.message.includes('success') ? 'verified' : 'warning'}
                        message={state.message}
                        className="w-full justify-center"
                    />
                </CardFooter>
            )}
        </Card>
    )
}

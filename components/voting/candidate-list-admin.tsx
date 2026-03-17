'use client'

import { deleteCandidate } from '@/lib/voting/actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'

interface Candidate {
    id: string
    names: string
    surnames: string
    party: string
    photo_url: string | null
}

export function CandidateListAdmin({ candidates }: { candidates: Candidate[] }) {
    if (candidates.length === 0) {
        return (
            <div className="text-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
                No hay candidatos registrados aún.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => (
                <Card key={candidate.id} className="overflow-hidden">
                    <div className="relative h-48 w-full bg-muted">
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
                        <div className="absolute top-2 right-2">
                            <form action={async (formData) => {
                                await deleteCandidate(formData)
                            }}>
                                <input type="hidden" name="id" value={candidate.id} />
                                <Button type="submit" variant="destructive" size="icon" className="h-8 w-8 rounded-full shadow-md">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-bold text-lg leading-tight">{candidate.names} {candidate.surnames}</h3>
                        <Badge variant="secondary" className="mt-2 font-normal">
                            {candidate.party}
                        </Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

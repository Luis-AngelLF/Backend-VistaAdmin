import { TrustHeader } from '@/components/layout/trust-header'
import { TrustBadge } from '@/components/ui/trust-badge'
import { Button } from '@/components/ui/button'
import { CandidateForm } from '@/components/voting/candidate-form'
import { CandidateListAdmin } from '@/components/voting/candidate-list-admin'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CandidatesPage() {
    const supabase = await createClient()
    const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-muted/30">
            <TrustHeader />
            <main className="container py-10">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Link href="/admin">
                                    <Button variant="ghost" size="sm">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <h1 className="text-3xl font-bold tracking-tight">Gestión de Candidatos</h1>
                            </div>
                            <p className="text-muted-foreground ml-10">
                                Administre los candidatos oficiales que aparecerán en la boleta.
                            </p>
                        </div>
                        <TrustBadge variant="info" message="Admin Access" />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Left Column: Form */}
                        <div className="lg:col-span-1">
                            <CandidateForm />
                        </div>

                        {/* Right Column: List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-xl font-semibold tracking-tight">Candidatos Registrados</h2>
                            <CandidateListAdmin candidates={candidates || []} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

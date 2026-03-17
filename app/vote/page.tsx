import { TrustHeader } from '@/components/layout/trust-header'
import { TrustBadge } from '@/components/ui/trust-badge'
import { BallotGrid } from '@/components/voting/ballot-grid'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { logout } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'

export default async function BallotPage() {
    const session = await getSession()
    if (!session) redirect('/login')

    const supabase = await createClient()

    // 1. Verify if already voted
    const { data: user } = await supabase
        .from('users')
        .select('has_voted')
        .eq('id', session.userId)
        .single()

    if (user?.has_voted) {
        return (
            <div className="min-h-screen bg-muted/30 flex flex-col">
                <TrustHeader />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="text-center space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold">Ya ha emitido su voto</h1>
                            <p className="text-muted-foreground">Su participación ya ha sido registrada en esta elección.</p>
                            <TrustBadge variant="verified" message="Voto Registrado" />
                        </div>
                        <form action={logout}>
                            <Button variant="outline" type="submit">Cerrar Sesión</Button>
                        </form>
                    </div>
                </main>
            </div>
        )
    }

    // 2. Fetch Candidates
    const { data: candidates } = await supabase
        .from('candidates')
        .select('*')
        .order('names', { ascending: true })

    return (
        <div className="min-h-screen bg-muted/30">
            <TrustHeader />
            <main className="container py-8">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight">Boleta Electoral 2026</h1>
                            <p className="text-muted-foreground">
                                Seleccione hasta 5 candidatos de su preferencia.
                            </p>
                        </div>
                        <form action={logout}>
                            <Button variant="outline" size="sm" type="submit" className="text-muted-foreground hover:text-destructive">
                                Cerrar Sesión
                            </Button>
                        </form>
                    </div>

                    <BallotGrid candidates={candidates || []} />
                </div>
            </main>
        </div>
    )
}

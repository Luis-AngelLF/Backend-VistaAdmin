import { TrustHeader } from '@/components/layout/trust-header'
import { TrustBadge } from '@/components/ui/trust-badge'
import { RegisterVoterForm } from '@/components/admin/register-voter-form'
import { VoterList } from '@/components/admin/voter-list'
import { ElectionTally } from '@/components/admin/election-tally'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth/actions'
import Link from 'next/link'

export default async function AdminPage() {
    const supabase = await createClient()

    // Fetch voters (Service Role / Session bypass RLS for admin)
    const { data: voters } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'voter')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-muted/30">
            <TrustHeader />
            <main className="container py-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                        <div className="flex gap-2">
                            <form action={logout}>
                                <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-destructive">
                                    Cerrar Sesión
                                </Button>
                            </form>
                            <Link href="/admin/candidates">
                                <Button variant="outline" size="sm">Gestión de Candidatos</Button>
                            </Link>
                            <TrustBadge variant="info" message="Admin Access" />
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <ElectionTally />
                        </div>
                        <div className="md:col-span-2">
                            <RegisterVoterForm />
                        </div>
                        <div className="md:col-span-2">
                            <VoterList voters={voters || []} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

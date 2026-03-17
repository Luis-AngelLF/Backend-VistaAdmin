import { Building2, ShieldCheck } from "lucide-react";

export function TrustHeader() {
    return (
        <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold leading-none tracking-tight">Sistema Electoral</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Elecciones 2026 • Región Nacional</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Conexión Segura & Verificada</span>
                </div>
            </div>
        </header>
    );
}

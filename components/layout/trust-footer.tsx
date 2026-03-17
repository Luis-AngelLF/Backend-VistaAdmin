import { Lock } from "lucide-react";

export function TrustFooter() {
    return (
        <footer className="w-full border-t border-border bg-muted/50 py-6">
            <div className="container flex flex-col items-center justify-between gap-4 px-4 text-center md:flex-row md:text-left md:px-8">
                <div className="text-xs text-muted-foreground">
                    <p>© 2026 Sistema Electoral Nacional. Todos los derechos reservados.</p>
                    <p>Auditoría en tiempo real activa.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>Sistema protegido por cifrado de extremo a extremo.</span>
                </div>
            </div>
        </footer>
    );
}

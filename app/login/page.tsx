import { TrustHeader } from "@/components/layout/trust-header";
import { TrustFooter } from "@/components/layout/trust-footer";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
            <TrustHeader />

            <main className="flex-1 flex items-center justify-center p-4">
                <LoginForm />
            </main>

            <TrustFooter />
        </div>
    );
}

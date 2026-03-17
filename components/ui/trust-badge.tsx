import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldAlert, BadgeInfo } from "lucide-react";

interface TrustBadgeProps {
    variant: "verified" | "warning" | "info" | "critical";
    message: string;
    icon?: React.ReactNode;
    className?: string;
}

export function TrustBadge({ variant, message, className }: TrustBadgeProps) {
    const styles = {
        verified: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200",
        warning: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200",
        info: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200",
        critical: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200",
    };

    const icons = {
        verified: <CheckCircle2 className="mr-1 h-3 w-3" />,
        warning: <ShieldAlert className="mr-1 h-3 w-3" />,
        info: <BadgeInfo className="mr-1 h-3 w-3" />,
        critical: <ShieldAlert className="mr-1 h-3 w-3" />,
    };

    return (
        <Badge
            variant="outline"
            className={cn("px-3 py-1 text-sm font-medium border transition-colors", styles[variant], className)}
        >
            <span className="flex items-center gap-1">
                {arguments[0].icon ? arguments[0].icon : icons[variant]}
                {message}
            </span>
        </Badge>
    );
}

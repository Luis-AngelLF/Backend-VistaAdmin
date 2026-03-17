import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
    currentStep: number;
    steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between">
                {/* Connector Line */}
                <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full bg-muted" />

                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber;
                    const isCurrent = currentStep === stepNumber;

                    return (
                        <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                                    isCompleted
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : isCurrent
                                            ? "border-primary bg-background text-primary"
                                            : "border-muted bg-background text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium uppercase tracking-wider",
                                    isCurrent ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

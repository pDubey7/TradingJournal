"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { OvertradingSignal } from "@/lib/analytics";

interface OvertradingAlertsProps {
    signals: OvertradingSignal[];
}

export function OvertradingAlerts({ signals }: OvertradingAlertsProps) {
    if (signals.length === 0) {
        return (
            <Alert className="border-green-500/50 bg-green-500/10">
                <Info className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-500">No Overtrading Detected</AlertTitle>
                <AlertDescription className="text-green-500/80">
                    Your trading behavior looks healthy. Keep up the good work!
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3">
            {signals.map((signal, index) => {
                const Icon = signal.severity === 'HIGH' ? AlertTriangle : AlertCircle;
                const colorClass = signal.severity === 'HIGH'
                    ? 'border-red-500/50 bg-red-500/10'
                    : signal.severity === 'MEDIUM'
                        ? 'border-orange-500/50 bg-orange-500/10'
                        : 'border-yellow-500/50 bg-yellow-500/10';

                const textColor = signal.severity === 'HIGH'
                    ? 'text-red-500'
                    : signal.severity === 'MEDIUM'
                        ? 'text-orange-500'
                        : 'text-yellow-500';

                return (
                    <Alert key={index} className={colorClass}>
                        <Icon className={`h-4 w-4 ${textColor}`} />
                        <AlertTitle className={`flex items-center gap-2 ${textColor}`}>
                            {signal.type.replace(/_/g, ' ')}
                            <Badge variant="outline" className={`${textColor} border-current`}>
                                {signal.severity}
                            </Badge>
                        </AlertTitle>
                        <AlertDescription className={`${textColor}/80`}>
                            {signal.message}
                        </AlertDescription>
                    </Alert>
                );
            })}
        </div>
    );
}

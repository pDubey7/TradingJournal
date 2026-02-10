"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Activity, DollarSign } from "lucide-react";
import type { RiskScore, ConsistencyScore, CapitalEfficiency } from "@/lib/analytics";

interface AdvancedMetricsProps {
    riskScore: RiskScore;
    consistencyScore: ConsistencyScore;
    capitalEfficiency: CapitalEfficiency;
}

export function AdvancedMetrics({ riskScore, consistencyScore, capitalEfficiency }: AdvancedMetricsProps) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CONSERVATIVE': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'BALANCED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'AGGRESSIVE': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'RECKLESS': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getEfficiencyColor = (level: string) => {
        switch (level) {
            case 'EXCELLENT': return 'text-green-500';
            case 'GOOD': return 'text-blue-500';
            case 'AVERAGE': return 'text-yellow-500';
            case 'INEFFICIENT': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {/* Risk Score */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold tabular-nums">{riskScore.overall}</div>
                        <Badge className={`${getRiskColor(riskScore.level)} border`}>
                            {riskScore.level}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {riskScore.recommendation}
                    </p>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Drawdown</span>
                            <span>{riskScore.components.drawdownSeverity}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Position Sizing</span>
                            <span>{riskScore.components.positionSizingConsistency}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Overtrading</span>
                            <span>{riskScore.components.overtradingIndex}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Consistency Score */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold tabular-nums">{consistencyScore.overall}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {consistencyScore.recommendation}
                    </p>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Win Rate Stability</span>
                            <span>{consistencyScore.components.winRateStability}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">PnL Variance</span>
                            <span>{consistencyScore.components.pnlVariance}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Trade Frequency</span>
                            <span>{consistencyScore.components.tradeFrequencyRegularity}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Capital Efficiency */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Capital Efficiency</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <div className={`text-3xl font-bold tabular-nums ${getEfficiencyColor(capitalEfficiency.level)}`}>
                            {capitalEfficiency.score.toFixed(2)}%
                        </div>
                        <Badge variant="outline">{capitalEfficiency.level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {capitalEfficiency.recommendation}
                    </p>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Capital Deployed</span>
                            <span>${capitalEfficiency.totalCapitalDeployed.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Net PnL</span>
                            <span className={capitalEfficiency.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                ${capitalEfficiency.netPnL.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

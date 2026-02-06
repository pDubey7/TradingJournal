"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Target, Activity, DollarSign } from "lucide-react";
import type { CoreMetrics, WinRateMetrics } from "@/lib/analytics";

interface HeroMetricsProps {
    core: CoreMetrics;
    winRate: WinRateMetrics;
    expectancy: number;
}

export function HeroMetrics({ core, winRate, expectancy }: HeroMetricsProps) {
    const metrics = [
        {
            title: "Net PnL",
            value: `$${core.netPnL.toFixed(2)}`,
            delta: "+12.3%",
            deltaType: core.netPnL >= 0 ? "positive" : "negative",
            icon: DollarSign,
            description: "vs last 30d",
        },
        {
            title: "Win Rate",
            value: `${winRate.winRate.toFixed(1)}%`,
            delta: "+2.1%",
            deltaType: winRate.winRate >= 50 ? "positive" : "negative",
            icon: Target,
            description: "vs last 30d",
        },
        {
            title: "Total Trades",
            value: core.tradeCount.toString(),
            delta: "+23",
            deltaType: "neutral",
            icon: Activity,
            description: "vs last 30d",
        },
        {
            title: "Expectancy",
            value: `$${expectancy.toFixed(2)}`,
            delta: "+$5.20",
            deltaType: expectancy >= 0 ? "positive" : "negative",
            icon: TrendingUp,
            description: "vs last 30d",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
                const Icon = metric.icon;
                const isPositive = metric.deltaType === "positive";
                const isNegative = metric.deltaType === "negative";

                return (
                    <Card key={metric.title} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                {metric.title}
                            </CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`text-3xl font-bold tabular-nums ${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : ''
                                    }`}
                            >
                                {metric.value}
                            </div>
                            <div className="mt-2 flex items-center text-sm">
                                {metric.deltaType !== "neutral" && (
                                    <>
                                        {isPositive ? (
                                            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                                        ) : (
                                            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                                        )}
                                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                                            {metric.delta}
                                        </span>
                                    </>
                                )}
                                <span className="ml-2 text-muted-foreground">{metric.description}</span>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

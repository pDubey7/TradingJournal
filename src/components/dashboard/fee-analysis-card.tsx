"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { VolumeAndFees } from "@/lib/analytics";

interface FeeAnalysisCardProps {
    metrics: VolumeAndFees;
}

export function FeeAnalysisCard({ metrics }: FeeAnalysisCardProps) {
    const data = [
        { name: 'Maker', value: metrics.makerFees, percentage: (metrics.makerFees / metrics.totalFees) * 100 },
        { name: 'Taker', value: metrics.takerFees, percentage: (metrics.takerFees / metrics.totalFees) * 100 },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={data} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                                type="number"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                className="text-xs"
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value) => `$${Number(value || 0).toFixed(2)}`}
                            />
                            <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Metrics */}
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Fees</span>
                            <span className="font-semibold text-amber-500">
                                ${metrics.totalFees.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fee % of PnL</span>
                            <span className="font-semibold">
                                {metrics.feePercentOfPnL.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Fee % of Volume</span>
                            <span className="font-semibold">
                                {metrics.feePercentOfVolume.toFixed(3)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Fee/Trade</span>
                            <span className="font-semibold">
                                ${metrics.avgFeePerTrade.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { DrawdownMetrics, EquityPoint } from "@/lib/analytics";

interface DrawdownChartProps {
    equityCurve: EquityPoint[];
    metrics: DrawdownMetrics;
}

export function DrawdownChart({ equityCurve, metrics }: DrawdownChartProps) {
    // Calculate drawdown for each point
    const chartData = equityCurve.map((point, index) => {
        const peakEquity = Math.max(...equityCurve.slice(0, index + 1).map(p => p.equity));
        const drawdown = peakEquity > 0 ? ((peakEquity - point.equity) / peakEquity) * 100 : 0;

        return {
            date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            drawdown: -drawdown, // Negative for visual effect
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Drawdown</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Max: <span className="font-semibold text-red-500">{metrics.maxDrawdown.toFixed(2)}%</span>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(value) => `${value.toFixed(1)}%`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                            formatter={(value) => [`${Math.abs(Number(value || 0)).toFixed(2)}%`, 'Drawdown']}
                        />
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#colorDrawdown)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

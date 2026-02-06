"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { LongShortMetrics } from "@/lib/analytics";

interface LongShortCardProps {
    metrics: LongShortMetrics;
}

export function LongShortCard({ metrics }: LongShortCardProps) {
    const data = [
        { name: 'Long', value: metrics.longCount, pnl: metrics.longPnL },
        { name: 'Short', value: metrics.shortCount, pnl: metrics.shortPnL },
    ];

    const COLORS = {
        Long: '#10b981',
        Short: '#ef4444',
    };

    const totalCount = metrics.longCount + metrics.shortCount;
    const longPercentage = totalCount > 0 ? (metrics.longCount / totalCount) * 100 : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Long/Short Bias</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry) => (
                                    <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value, name, props) => [
                                    `${Number(value || 0)} trades ($${props?.payload?.pnl?.toFixed(2) || '0.00'})`,
                                    name
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="mt-4 w-full space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                Long
                            </span>
                            <span className="font-semibold">{longPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                Short
                            </span>
                            <span className="font-semibold">{(100 - longPercentage).toFixed(1)}%</span>
                        </div>
                        <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Long PnL</span>
                                <span className={metrics.longPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    ${metrics.longPnL.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Short PnL</span>
                                <span className={metrics.shortPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                    ${metrics.shortPnL.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

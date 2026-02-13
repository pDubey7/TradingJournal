"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HourlyStats } from "@/lib/analytics";

interface TimePerformanceCardProps {
    hourlyData: HourlyStats[];
}

export function TimePerformanceCard({ hourlyData }: TimePerformanceCardProps) {
    // Find best and worst hours
    if (!hourlyData || hourlyData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Time Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No performance data available
                    </div>
                </CardContent>
            </Card>
        );
    }
    const sortedByPnL = [...hourlyData].sort((a, b) => b.pnl - a.pnl);
    const bestHour = sortedByPnL[0];
    const worstHour = sortedByPnL[sortedByPnL.length - 1];

    // Create heatmap data (simplified - showing key hours)
    const keyHours = [9, 10, 11, 12, 13, 14, 15, 16];
    const heatmapData = keyHours.map(hour => {
        const data = hourlyData.find(h => h.hour === hour);
        return {
            hour,
            pnl: data?.pnl || 0,
            tradeCount: data?.tradeCount || 0,
        };
    });

    const getColorForPnL = (pnl: number) => {
        if (pnl > 100) return 'bg-green-600';
        if (pnl > 50) return 'bg-green-500';
        if (pnl > 0) return 'bg-green-400';
        if (pnl === 0) return 'bg-gray-500';
        if (pnl > -50) return 'bg-red-400';
        if (pnl > -100) return 'bg-red-500';
        return 'bg-red-600';
    };

    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}${period}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Time Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Heatmap Grid */}
                    <div className="grid grid-cols-4 gap-2">
                        {heatmapData.map(({ hour, pnl, tradeCount }) => (
                            <div
                                key={hour}
                                className={`
                  relative rounded p-3 text-center transition-all hover:scale-105 cursor-pointer
                  ${getColorForPnL(pnl)}
                `}
                                title={`${formatHour(hour)}: $${pnl.toFixed(2)} (${tradeCount} trades)`}
                            >
                                <div className="text-xs font-medium text-white">
                                    {formatHour(hour)}
                                </div>
                                <div className="text-xs text-white/80 mt-1">
                                    {tradeCount > 0 ? `${tradeCount}` : '-'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Best Hour</span>
                            <span className="font-semibold text-green-500">
                                {formatHour(bestHour.hour)} (+${bestHour.pnl.toFixed(2)})
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Worst Hour</span>
                            <span className="font-semibold text-red-500">
                                {formatHour(worstHour.hour)} (${worstHour.pnl.toFixed(2)})
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

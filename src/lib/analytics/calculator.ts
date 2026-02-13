import type {
    Position,
    Execution,
    CoreMetrics,
    WinRateMetrics,
    AvgWinLoss,
    LongShortMetrics,
    DurationMetrics,
    ExtremeMetrics,
    VolumeAndFees,
    EquityPoint,
    DrawdownMetrics,
    DailyStats,
    HourlyStats,
    OrderTypeStats,
    CompleteAnalytics,
} from './types';

import {
    calculateRiskScore,
    detectOvertrading,
    calculateConsistencyScore,
    calculateCapitalEfficiency
} from './advanced';

// Helper to safely convert Decimal strings to numbers
const toNum = (val: string | number | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    return typeof val === 'number' ? val : parseFloat(val);
};

// ============================================================================
// CORE METRICS
// ============================================================================

export function calculateCoreMetrics(
    positions: Position[],
    executions: Execution[]
): CoreMetrics {
    const closed = positions.filter(p => p.status === 'CLOSED');

    const grossPnL = closed.reduce((sum, p) => sum + toNum(p.realizedPnL), 0);
    const totalFees = executions.reduce((sum, e) => sum + toNum(e.fee), 0);
    const totalVolume = executions.reduce((sum, e) => sum + toNum(e.notional), 0);

    return {
        grossPnL,
        netPnL: grossPnL - totalFees,
        totalFees,
        totalVolume,
        tradeCount: closed.length,
    };
}

// ============================================================================
// WIN RATE METRICS
// ============================================================================

export function calculateWinRate(positions: Position[]): WinRateMetrics {
    const closed = positions.filter(p => p.status === 'CLOSED');
    const total = closed.length;

    if (total === 0) {
        return {
            winRate: 0,
            lossRate: 0,
            breakevenRate: 0,
            winCount: 0,
            lossCount: 0,
            breakevenCount: 0,
            totalTrades: 0,
        };
    }

    const wins = closed.filter(p => toNum(p.realizedPnL) > 0);
    const losses = closed.filter(p => toNum(p.realizedPnL) < 0);
    const breakevens = closed.filter(p => toNum(p.realizedPnL) === 0);

    return {
        winRate: (wins.length / total) * 100,
        lossRate: (losses.length / total) * 100,
        breakevenRate: (breakevens.length / total) * 100,
        winCount: wins.length,
        lossCount: losses.length,
        breakevenCount: breakevens.length,
        totalTrades: total,
    };
}

// ============================================================================
// AVERAGE WIN/LOSS
// ============================================================================

export function calculateAvgWinLoss(positions: Position[]): AvgWinLoss {
    const closed = positions.filter(p => p.status === 'CLOSED');
    const wins = closed.filter(p => toNum(p.realizedPnL) > 0);
    const losses = closed.filter(p => toNum(p.realizedPnL) < 0);

    const avgWin = wins.length > 0
        ? wins.reduce((sum, p) => sum + toNum(p.realizedPnL), 0) / wins.length
        : 0;

    const avgLoss = losses.length > 0
        ? losses.reduce((sum, p) => sum + toNum(p.realizedPnL), 0) / losses.length
        : 0;

    const winLossRatio = avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : 0;

    return { avgWin, avgLoss, winLossRatio };
}

// ============================================================================
// EXPECTANCY
// ============================================================================

export function calculateExpectancy(positions: Position[]): number {
    const closed = positions.filter(p => p.status === 'CLOSED');
    if (closed.length === 0) return 0;

    const totalPnL = closed.reduce((sum, p) => sum + toNum(p.realizedPnL), 0);
    return totalPnL / closed.length;
}

// ============================================================================
// LONG/SHORT METRICS
// ============================================================================

export function calculateLongShortMetrics(positions: Position[]): LongShortMetrics {
    const closed = positions.filter(p => p.status === 'CLOSED');

    const longs = closed.filter(p => p.side === 'LONG' || p.side === 'BUY');
    const shorts = closed.filter(p => p.side === 'SHORT' || p.side === 'SELL');

    const longPnL = longs.reduce((sum, p) => sum + toNum(p.realizedPnL), 0);
    const shortPnL = shorts.reduce((sum, p) => sum + toNum(p.realizedPnL), 0);

    return {
        longCount: longs.length,
        shortCount: shorts.length,
        longPnL,
        shortPnL,
        countRatio: shorts.length > 0 ? longs.length / shorts.length : longs.length,
        pnlRatio: shortPnL !== 0 ? longPnL / Math.abs(shortPnL) : 0,
    };
}

// ============================================================================
// DURATION METRICS
// ============================================================================

export function calculateDurationMetrics(positions: Position[]): DurationMetrics {
    const closed = positions.filter(p => p.status === 'CLOSED' && p.closedAt);

    if (closed.length === 0) {
        return {
            avgDurationSeconds: 0,
            avgDurationHours: 0,
            avgDurationDays: 0,
            medianDurationSeconds: 0,
            shortestTrade: 0,
            longestTrade: 0,
        };
    }

    const durations = closed.map(p => {
        const open = new Date(p.openedAt).getTime();
        const close = new Date(p.closedAt!).getTime();
        return (close - open) / 1000; // seconds
    });

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;

    const sorted = [...durations].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
        avgDurationSeconds: avg,
        avgDurationHours: avg / 3600,
        avgDurationDays: avg / 86400,
        medianDurationSeconds: median,
        shortestTrade: Math.min(...durations),
        longestTrade: Math.max(...durations),
    };
}

// ============================================================================
// EXTREME METRICS
// ============================================================================

export function calculateExtremes(positions: Position[]): ExtremeMetrics {
    const closed = positions.filter(p => p.status === 'CLOSED');

    if (closed.length === 0) {
        return {
            largestGain: 0,
            largestLoss: 0,
            largestGainSymbol: '',
            largestLossSymbol: '',
        };
    }

    const bestTrade = closed.reduce((max, p) =>
        toNum(p.realizedPnL) > toNum(max.realizedPnL) ? p : max
    );

    const worstTrade = closed.reduce((min, p) =>
        toNum(p.realizedPnL) < toNum(min.realizedPnL) ? p : min
    );

    return {
        largestGain: toNum(bestTrade.realizedPnL),
        largestLoss: toNum(worstTrade.realizedPnL),
        largestGainSymbol: bestTrade.symbol,
        largestLossSymbol: worstTrade.symbol,
        largestGainDate: bestTrade.closedAt,
        largestLossDate: worstTrade.closedAt,
    };
}

// ============================================================================
// VOLUME & FEES
// ============================================================================

export function calculateVolumeAndFees(
    executions: Execution[],
    positions: Position[]
): VolumeAndFees {
    const totalVolume = executions.reduce((sum, e) => sum + toNum(e.notional), 0);
    const totalFees = executions.reduce((sum, e) => sum + toNum(e.fee), 0);

    const makerFees = executions
        .filter(e => e.isMaker)
        .reduce((sum, e) => sum + toNum(e.fee), 0);

    const takerFees = executions
        .filter(e => !e.isMaker)
        .reduce((sum, e) => sum + toNum(e.fee), 0);

    const closed = positions.filter(p => p.status === 'CLOSED');
    const grossPnL = closed.reduce((sum, p) => sum + toNum(p.realizedPnL), 0);

    return {
        totalVolume,
        totalFees,
        feePercentOfPnL: grossPnL !== 0 ? (totalFees / Math.abs(grossPnL)) * 100 : 0,
        feePercentOfVolume: totalVolume !== 0 ? (totalFees / totalVolume) * 100 : 0,
        avgFeePerTrade: closed.length > 0 ? totalFees / closed.length : 0,
        makerFees,
        takerFees,
    };
}

// ============================================================================
// EQUITY CURVE
// ============================================================================

export function calculateEquityCurve(
    positions: Position[],
    startingBalance: number = 10000
): EquityPoint[] {
    const closed = positions
        .filter(p => p.status === 'CLOSED' && p.closedAt)
        .sort((a, b) => new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime());

    let cumulativePnL = 0;

    return closed.map((p, index) => {
        cumulativePnL += toNum(p.realizedPnL);

        return {
            timestamp: new Date(p.closedAt!),
            equity: startingBalance + cumulativePnL,
            cumulativePnL,
            tradeNumber: index + 1,
        };
    });
}

// ============================================================================
// DRAWDOWN
// ============================================================================

export function calculateDrawdown(equityCurve: EquityPoint[]): DrawdownMetrics {
    if (equityCurve.length === 0) {
        return {
            maxDrawdown: 0,
            maxDrawdownValue: 0,
            currentDrawdown: 0,
        };
    }

    let peak = equityCurve[0].equity;
    let maxDD = 0;
    let maxDDValue = 0;
    let maxDDDate: Date | undefined;

    for (const point of equityCurve) {
        if (point.equity > peak) {
            peak = point.equity;
        }

        const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
        const ddValue = peak - point.equity;

        if (dd > maxDD) {
            maxDD = dd;
            maxDDValue = ddValue;
            maxDDDate = point.timestamp;
        }
    }

    const currentEquity = equityCurve[equityCurve.length - 1].equity;
    const currentPeak = Math.max(...equityCurve.map(p => p.equity));
    const currentDD = currentPeak > 0 ? ((currentPeak - currentEquity) / currentPeak) * 100 : 0;

    return {
        maxDrawdown: maxDD,
        maxDrawdownValue: maxDDValue,
        currentDrawdown: currentDD,
        maxDrawdownDate: maxDDDate,
    };
}

// ============================================================================
// DAILY PERFORMANCE
// ============================================================================

export function calculateDailyPerformance(positions: Position[]): DailyStats[] {
    const byDate = new Map<string, Position[]>();

    positions
        .filter(p => p.status === 'CLOSED' && p.closedAt)
        .forEach(p => {
            const date = new Date(p.closedAt!).toISOString().split('T')[0];
            if (!byDate.has(date)) byDate.set(date, []);
            byDate.get(date)!.push(p);
        });

    return Array.from(byDate.entries())
        .map(([date, trades]) => {
            const pnl = trades.reduce((sum, t) => sum + toNum(t.realizedPnL), 0);
            const volume = trades.reduce((sum, t) => sum + toNum(t.totalVolume), 0);
            const wins = trades.filter(t => toNum(t.realizedPnL) > 0).length;

            return {
                date,
                pnl,
                volume,
                tradeCount: trades.length,
                winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// HOURLY PERFORMANCE
// ============================================================================

export function calculateHourlyPerformance(positions: Position[]): HourlyStats[] {
    const byHour = new Map<number, Position[]>();

    for (let h = 0; h < 24; h++) {
        byHour.set(h, []);
    }

    positions
        .filter(p => p.status === 'CLOSED' && p.closedAt)
        .forEach(p => {
            const hour = new Date(p.closedAt!).getUTCHours();
            byHour.get(hour)!.push(p);
        });

    return Array.from(byHour.entries()).map(([hour, trades]) => {
        const pnl = trades.reduce((sum, t) => sum + toNum(t.realizedPnL), 0);
        const wins = trades.filter(t => toNum(t.realizedPnL) > 0).length;

        return {
            hour,
            pnl,
            tradeCount: trades.length,
            avgPnL: trades.length > 0 ? pnl / trades.length : 0,
            winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        };
    });
}

// ============================================================================
// ORDER TYPE PERFORMANCE
// ============================================================================

export function calculateOrderTypePerformance(
    positions: Position[],
    executions: Execution[]
): OrderTypeStats[] {
    // Map positions to their primary order type (from first execution)
    const positionOrderTypes = new Map<string, string>();

    executions.forEach(e => {
        if (e.positionId && !positionOrderTypes.has(e.positionId)) {
            positionOrderTypes.set(e.positionId, e.orderType);
        }
    });

    const byType = new Map<string, Position[]>();

    positions
        .filter(p => p.status === 'CLOSED')
        .forEach(p => {
            const type = positionOrderTypes.get(p.id) || 'UNKNOWN';
            if (!byType.has(type)) byType.set(type, []);
            byType.get(type)!.push(p);
        });

    return Array.from(byType.entries()).map(([orderType, trades]) => {
        const pnl = trades.reduce((sum, t) => sum + toNum(t.realizedPnL), 0);
        const wins = trades.filter(t => toNum(t.realizedPnL) > 0).length;

        return {
            orderType,
            pnl,
            tradeCount: trades.length,
            winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
            avgPnL: trades.length > 0 ? pnl / trades.length : 0,
        };
    });
}

// ============================================================================
// COMPLETE ANALYTICS
// ============================================================================

export function calculateCompleteAnalytics(
    positions: Position[],
    executions: Execution[],
    startingBalance: number = 10000
): CompleteAnalytics {
    const equityCurve = calculateEquityCurve(positions, startingBalance);

    // Dynamic import to avoid circular dependencies if any, but regular import is better. 
    // We need to import these functions at the top of the file first.
    // For now assuming we will add imports in a separate step or here if possible.
    // Actually, I should update imports first or use full paths if I can't.
    // Let's use the functions assuming they are imported. I will add imports in a separate edit.

    return {
        core: calculateCoreMetrics(positions, executions),
        winRate: calculateWinRate(positions),
        avgWinLoss: calculateAvgWinLoss(positions),
        longShort: calculateLongShortMetrics(positions),
        duration: calculateDurationMetrics(positions),
        extremes: calculateExtremes(positions),
        volumeAndFees: calculateVolumeAndFees(executions, positions),
        expectancy: calculateExpectancy(positions),
        equityCurve,
        drawdown: calculateDrawdown(equityCurve),
        dailyPerformance: calculateDailyPerformance(positions),
        hourlyPerformance: calculateHourlyPerformance(positions),
        orderTypePerformance: calculateOrderTypePerformance(positions, executions),

        // Advanced Metrics
        riskScore: calculateRiskScore(positions, executions, startingBalance),
        overtradingSignals: detectOvertrading(positions),
        consistencyScore: calculateConsistencyScore(positions),
        capitalEfficiency: calculateCapitalEfficiency(positions, executions),
    };
}

import type {
    Position,
    Execution,
    RiskScore,
    OvertradingSignal,
    ConsistencyScore,
    CapitalEfficiency
} from './types';

// ============================================================================
// ADVANCED ANALYTICS - MVP FEATURES
// ============================================================================

// ----------------------------------------------------------------------------
// 1. RISK SCORE (0-100)
// ----------------------------------------------------------------------------

// RiskScore interface imported from ./types

export function calculateRiskScore(
    positions: Position[],
    executions: Execution[],
    accountBalance: number = 10000
): RiskScore {
    const closed = positions.filter(p => p.status === 'CLOSED');

    if (closed.length === 0) {
        return {
            overall: 0,
            level: 'CONSERVATIVE',
            components: {
                drawdownSeverity: 0,
                positionSizingConsistency: 0,
                overtradingIndex: 0,
                winStreakVolatility: 0,
                feeBurnRate: 0,
            },
            recommendation: 'Not enough data to calculate risk score.'
        };
    }

    // Component 1: Drawdown Severity (30%)
    const equityCurve = calculateEquityCurve(closed, accountBalance);
    const { maxDrawdown, currentDrawdown } = calculateDrawdown(equityCurve);
    const drawdownSeverity = maxDrawdown > 0 ? (currentDrawdown / maxDrawdown) * 100 : 0;

    // Component 2: Position Sizing Consistency (20%)
    const sizes = closed.map(p => parseFloat(p.maxSize));
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const sizeStdDev = Math.sqrt(
        sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length
    );
    const positionSizingConsistency = avgSize > 0 ? (sizeStdDev / avgSize) * 100 : 0;

    // Component 3: Overtrading Index (20%)
    const dayCount = getDayCount(closed);
    const tradesPerDay = closed.length / Math.max(dayCount, 1);
    const profitableTrades = closed.filter(p => parseFloat(p.realizedPnL || '0') > 0).length;
    const profitablePerDay = profitableTrades / Math.max(dayCount, 1);
    const overtradingIndex = profitablePerDay > 0 ? (tradesPerDay / profitablePerDay) * 100 : 100;

    // Component 4: Win Streak Volatility (15%)
    const streaks = calculateStreaks(closed);
    const streakLengths = streaks.map(s => Math.abs(s.length));
    const avgStreakLength = streakLengths.reduce((a, b) => a + b, 0) / streakLengths.length;
    const streakStdDev = Math.sqrt(
        streakLengths.reduce((sum, len) => sum + Math.pow(len - avgStreakLength, 2), 0) / streakLengths.length
    );
    const winStreakVolatility = avgStreakLength > 0 ? (streakStdDev / avgStreakLength) * 100 : 0;

    // Component 5: Fee Burn Rate (15%)
    const totalFees = executions.reduce((sum, e) => sum + parseFloat(e.fee), 0);
    const feeBurnRate = accountBalance > 0 ? (totalFees / accountBalance) * 100 : 0;

    // Weighted Score
    const overall = Math.min(100, Math.max(0,
        drawdownSeverity * 0.30 +
        positionSizingConsistency * 0.20 +
        Math.min(overtradingIndex, 100) * 0.20 +
        winStreakVolatility * 0.15 +
        feeBurnRate * 0.15
    ));

    // Determine Level
    let level: RiskScore['level'];
    let recommendation: string;

    if (overall <= 30) {
        level = 'CONSERVATIVE';
        recommendation = 'Your trading style is conservative. Consider increasing position sizes for better returns.';
    } else if (overall <= 60) {
        level = 'BALANCED';
        recommendation = 'Your risk profile is balanced. Maintain this approach for consistent results.';
    } else if (overall <= 80) {
        level = 'AGGRESSIVE';
        recommendation = 'You are trading aggressively. Monitor your drawdowns and position sizing.';
    } else {
        level = 'RECKLESS';
        recommendation = 'WARNING: Your trading is reckless. Reduce position sizes and trade frequency immediately.';
    }

    return {
        overall: Math.round(overall),
        level,
        components: {
            drawdownSeverity: Math.round(drawdownSeverity),
            positionSizingConsistency: Math.round(positionSizingConsistency),
            overtradingIndex: Math.round(Math.min(overtradingIndex, 100)),
            winStreakVolatility: Math.round(winStreakVolatility),
            feeBurnRate: Math.round(feeBurnRate),
        },
        recommendation
    };
}

// ----------------------------------------------------------------------------
// 2. OVERTRADING DETECTION
// ----------------------------------------------------------------------------

// OvertradingSignal interface imported from ./types

export function detectOvertrading(positions: Position[]): OvertradingSignal[] {
    const signals: OvertradingSignal[] = [];
    const closed = positions.filter(p => p.status === 'CLOSED' && p.closedAt);
    const sorted = closed.sort((a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime()
    );

    // 1. Revenge Trading: Loss followed by 3+ trades within 30 minutes
    for (let i = 0; i < sorted.length - 3; i++) {
        const trade = sorted[i];
        const pnl = parseFloat(trade.realizedPnL || '0');

        if (pnl < 0) {
            const next30Min = sorted.filter(t => {
                const timeDiff = new Date(t.closedAt!).getTime() - new Date(trade.closedAt!).getTime();
                return timeDiff > 0 && timeDiff < 30 * 60 * 1000;
            });

            if (next30Min.length >= 3) {
                signals.push({
                    type: 'REVENGE_TRADING',
                    severity: 'HIGH',
                    message: `You opened ${next30Min.length} trades within 30 minutes after a $${Math.abs(pnl).toFixed(2)} loss. Take a break.`,
                    data: { lossAmount: pnl, subsequentTrades: next30Min.length }
                });
                break; // Only report once
            }
        }
    }

    // 2. Chasing: Multiple entries in same symbol after initial loss
    const bySymbol = groupBy(sorted, 'symbol');
    for (const [symbol, trades] of Object.entries(bySymbol)) {
        const losses = trades.filter(t => parseFloat(t.realizedPnL || '0') < 0);
        if (losses.length >= 2 && trades.length >= 4) {
            signals.push({
                type: 'CHASING',
                severity: 'MEDIUM',
                message: `You're chasing ${symbol} after ${losses.length} losses. Consider moving on to a different symbol.`,
                data: { symbol, losses: losses.length, total: trades.length }
            });
        }
    }

    // 3. Fatigue Trading: >10 trades in a day with declining win rate
    const byDay = groupByDay(sorted);
    for (const [day, trades] of Object.entries(byDay)) {
        if (trades.length > 10) {
            const firstHalf = trades.slice(0, Math.floor(trades.length / 2));
            const secondHalf = trades.slice(Math.floor(trades.length / 2));

            const firstHalfWR = calculateWinRate(firstHalf);
            const secondHalfWR = calculateWinRate(secondHalf);

            if (secondHalfWR < firstHalfWR - 20) {
                signals.push({
                    type: 'FATIGUE_TRADING',
                    severity: 'HIGH',
                    message: `You made ${trades.length} trades on ${day}. Your win rate dropped from ${firstHalfWR.toFixed(0)}% to ${secondHalfWR.toFixed(0)}%. You may be fatigued.`,
                    data: { date: day, tradeCount: trades.length, wrDrop: firstHalfWR - secondHalfWR }
                });
            }
        }
    }

    // 4. FOMO Clustering: 5+ trades in <1 hour (all same direction)
    for (let i = 0; i < sorted.length - 5; i++) {
        const trade = sorted[i];
        const next1Hour = sorted.filter(t => {
            const timeDiff = new Date(t.closedAt!).getTime() - new Date(trade.closedAt!).getTime();
            return timeDiff > 0 && timeDiff < 60 * 60 * 1000;
        });

        if (next1Hour.length >= 5) {
            const allSameSide = next1Hour.every(t => t.side === trade.side);
            if (allSameSide) {
                signals.push({
                    type: 'FOMO_CLUSTERING',
                    severity: 'MEDIUM',
                    message: `You opened ${next1Hour.length + 1} ${trade.side} positions within 1 hour. This may be FOMO.`,
                    data: { side: trade.side, count: next1Hour.length + 1 }
                });
                break;
            }
        }
    }

    return signals;
}

// ----------------------------------------------------------------------------
// 3. CONSISTENCY SCORE (0-100)
// ----------------------------------------------------------------------------

// ConsistencyScore interface imported from ./types

export function calculateConsistencyScore(positions: Position[]): ConsistencyScore {
    const closed = positions.filter(p => p.status === 'CLOSED');

    if (closed.length < 10) {
        return {
            overall: 0,
            components: {
                winRateStability: 0,
                pnlVariance: 0,
                tradeFrequencyRegularity: 0,
                drawdownRecoveryTime: 0,
                profitFactorStability: 0,
            },
            recommendation: 'Need at least 10 trades to calculate consistency score.'
        };
    }

    // Component 1: Win Rate Stability (25%)
    const weeklyWinRates = calculateWeeklyWinRates(closed);
    const wrMean = weeklyWinRates.reduce((a, b) => a + b, 0) / weeklyWinRates.length;
    const wrStdDev = Math.sqrt(
        weeklyWinRates.reduce((sum, wr) => sum + Math.pow(wr - wrMean, 2), 0) / weeklyWinRates.length
    );
    const winRateStability = wrMean > 0 ? (1 - (wrStdDev / wrMean)) * 100 : 0;

    // Component 2: PnL Variance (25%)
    const dailyPnLs = calculateDailyPnLs(closed);
    const pnlMean = dailyPnLs.reduce((a, b) => a + b, 0) / dailyPnLs.length;
    const pnlStdDev = Math.sqrt(
        dailyPnLs.reduce((sum, pnl) => sum + Math.pow(pnl - pnlMean, 2), 0) / dailyPnLs.length
    );
    const pnlVariance = Math.abs(pnlMean) > 0 ? (1 - (pnlStdDev / Math.abs(pnlMean))) * 100 : 0;

    // Component 3: Trade Frequency Regularity (20%)
    const weeklyTradeCounts = calculateWeeklyTradeCounts(closed);
    const tcMean = weeklyTradeCounts.reduce((a, b) => a + b, 0) / weeklyTradeCounts.length;
    const tcStdDev = Math.sqrt(
        weeklyTradeCounts.reduce((sum, tc) => sum + Math.pow(tc - tcMean, 2), 0) / weeklyTradeCounts.length
    );
    const tradeFrequencyRegularity = tcMean > 0 ? (1 - (tcStdDev / tcMean)) * 100 : 0;

    // Component 4: Drawdown Recovery Time (15%) - Lower is better
    const avgRecoveryDays = calculateAvgDrawdownRecovery(closed);
    const drawdownRecoveryTime = Math.max(0, 100 - avgRecoveryDays * 10);

    // Component 5: Profit Factor Stability (15%)
    const monthlyProfitFactors = calculateMonthlyProfitFactors(closed);
    const pfMean = monthlyProfitFactors.reduce((a, b) => a + b, 0) / monthlyProfitFactors.length;
    const pfStdDev = Math.sqrt(
        monthlyProfitFactors.reduce((sum, pf) => sum + Math.pow(pf - pfMean, 2), 0) / monthlyProfitFactors.length
    );
    const profitFactorStability = pfMean > 0 ? (1 - (pfStdDev / pfMean)) * 100 : 0;

    // Weighted Score
    const overall = Math.min(100, Math.max(0,
        Math.max(winRateStability, 0) * 0.25 +
        Math.max(pnlVariance, 0) * 0.25 +
        Math.max(tradeFrequencyRegularity, 0) * 0.20 +
        Math.max(drawdownRecoveryTime, 0) * 0.15 +
        Math.max(profitFactorStability, 0) * 0.15
    ));

    let recommendation: string;
    if (overall >= 70) {
        recommendation = 'Excellent consistency! You trade like a professional.';
    } else if (overall >= 50) {
        recommendation = 'Good consistency. Focus on maintaining regular trading patterns.';
    } else if (overall >= 30) {
        recommendation = 'Moderate consistency. Work on stabilizing your win rate and PnL.';
    } else {
        recommendation = 'Low consistency. Your results are too volatile. Focus on a proven strategy.';
    }

    return {
        overall: Math.round(overall),
        components: {
            winRateStability: Math.round(Math.max(winRateStability, 0)),
            pnlVariance: Math.round(Math.max(pnlVariance, 0)),
            tradeFrequencyRegularity: Math.round(Math.max(tradeFrequencyRegularity, 0)),
            drawdownRecoveryTime: Math.round(Math.max(drawdownRecoveryTime, 0)),
            profitFactorStability: Math.round(Math.max(profitFactorStability, 0)),
        },
        recommendation
    };
}

// ----------------------------------------------------------------------------
// 4. CAPITAL EFFICIENCY SCORE
// ----------------------------------------------------------------------------

// CapitalEfficiency interface imported from ./types

export function calculateCapitalEfficiency(
    positions: Position[],
    executions: Execution[]
): CapitalEfficiency {
    const closed = positions.filter(p => p.status === 'CLOSED');

    if (closed.length === 0) {
        return {
            score: 0,
            level: 'INEFFICIENT',
            totalCapitalDeployed: 0,
            netPnL: 0,
            recommendation: 'No closed positions to analyze.'
        };
    }

    // Calculate total capital deployed (sum of all position notional values)
    const totalCapitalDeployed = closed.reduce((sum, p) =>
        sum + parseFloat(p.totalVolume), 0
    );

    // Calculate net PnL
    const grossPnL = closed.reduce((sum, p) => sum + parseFloat(p.realizedPnL || '0'), 0);
    const totalFees = executions.reduce((sum, e) => sum + parseFloat(e.fee), 0);
    const netPnL = grossPnL - totalFees;

    // Calculate efficiency
    const score = totalCapitalDeployed > 0 ? (netPnL / totalCapitalDeployed) * 100 : 0;

    // Determine level
    let level: CapitalEfficiency['level'];
    let recommendation: string;

    if (score < 5) {
        level = 'INEFFICIENT';
        recommendation = 'Your capital efficiency is low. You may be overtrading or using poor position sizing.';
    } else if (score < 15) {
        level = 'AVERAGE';
        recommendation = 'Average capital efficiency. Focus on quality trades over quantity.';
    } else if (score < 30) {
        level = 'GOOD';
        recommendation = 'Good capital efficiency! You are converting capital to profit effectively.';
    } else {
        level = 'EXCELLENT';
        recommendation = 'Excellent capital efficiency! You are maximizing returns on deployed capital.';
    }

    return {
        score: Math.round(score * 100) / 100,
        level,
        totalCapitalDeployed,
        netPnL,
        recommendation
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
        const group = String(item[key]);
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {} as Record<string, T[]>);
}

function groupByDay(positions: Position[]): Record<string, Position[]> {
    return positions.reduce((result, p) => {
        const day = new Date(p.closedAt!).toISOString().split('T')[0];
        if (!result[day]) result[day] = [];
        result[day].push(p);
        return result;
    }, {} as Record<string, Position[]>);
}

function calculateWinRate(positions: Position[]): number {
    const wins = positions.filter(p => parseFloat(p.realizedPnL || '0') > 0).length;
    return positions.length > 0 ? (wins / positions.length) * 100 : 0;
}

function getDayCount(positions: Position[]): number {
    if (positions.length === 0) return 0;
    const sorted = positions.sort((a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime()
    );
    const first = new Date(sorted[0].closedAt!);
    const last = new Date(sorted[sorted.length - 1].closedAt!);
    return Math.max(1, Math.ceil((last.getTime() - first.getTime()) / (24 * 60 * 60 * 1000)));
}

function calculateStreaks(positions: Position[]): Array<{ length: number; type: 'win' | 'loss' }> {
    const sorted = positions.sort((a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime()
    );

    const streaks: Array<{ length: number; type: 'win' | 'loss' }> = [];
    let currentStreak = 0;
    let currentType: 'win' | 'loss' | null = null;

    for (const p of sorted) {
        const won = parseFloat(p.realizedPnL || '0') > 0;
        const type = won ? 'win' : 'loss';

        if (type === currentType) {
            currentStreak++;
        } else {
            if (currentType !== null) {
                streaks.push({ length: currentStreak, type: currentType });
            }
            currentType = type;
            currentStreak = 1;
        }
    }

    if (currentType !== null) {
        streaks.push({ length: currentStreak, type: currentType });
    }

    return streaks;
}

function calculateEquityCurve(positions: Position[], startingBalance: number): Array<{ equity: number; timestamp: Date }> {
    const sorted = positions.sort((a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime()
    );

    let equity = startingBalance;
    return sorted.map(p => {
        equity += parseFloat(p.realizedPnL || '0');
        return { equity, timestamp: new Date(p.closedAt!) };
    });
}

function calculateDrawdown(equityCurve: Array<{ equity: number; timestamp: Date }>): { maxDrawdown: number; currentDrawdown: number } {
    let peak = equityCurve[0]?.equity || 0;
    let maxDD = 0;

    for (const point of equityCurve) {
        if (point.equity > peak) peak = point.equity;
        const dd = peak > 0 ? ((peak - point.equity) / peak) * 100 : 0;
        if (dd > maxDD) maxDD = dd;
    }

    const currentEquity = equityCurve[equityCurve.length - 1]?.equity || 0;
    const currentPeak = Math.max(...equityCurve.map(p => p.equity));
    const currentDD = currentPeak > 0 ? ((currentPeak - currentEquity) / currentPeak) * 100 : 0;

    return { maxDrawdown: maxDD, currentDrawdown: currentDD };
}

function calculateWeeklyWinRates(positions: Position[]): number[] {
    const byWeek: Record<string, Position[]> = {};

    positions.forEach(p => {
        const week = getWeekKey(new Date(p.closedAt!));
        if (!byWeek[week]) byWeek[week] = [];
        byWeek[week].push(p);
    });

    return Object.values(byWeek).map(calculateWinRate);
}

function calculateDailyPnLs(positions: Position[]): number[] {
    const byDay = groupByDay(positions);
    return Object.values(byDay).map(trades =>
        trades.reduce((sum, t) => sum + parseFloat(t.realizedPnL || '0'), 0)
    );
}

function calculateWeeklyTradeCounts(positions: Position[]): number[] {
    const byWeek: Record<string, Position[]> = {};

    positions.forEach(p => {
        const week = getWeekKey(new Date(p.closedAt!));
        if (!byWeek[week]) byWeek[week] = [];
        byWeek[week].push(p);
    });

    return Object.values(byWeek).map(trades => trades.length);
}

function calculateAvgDrawdownRecovery(positions: Position[]): number {
    // Simplified: average days between loss and next profit
    const sorted = positions.sort((a, b) =>
        new Date(a.closedAt!).getTime() - new Date(b.closedAt!).getTime()
    );

    const recoveryTimes: number[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const pnl = parseFloat(sorted[i].realizedPnL || '0');
        if (pnl < 0) {
            // Find next winning trade
            for (let j = i + 1; j < sorted.length; j++) {
                const nextPnl = parseFloat(sorted[j].realizedPnL || '0');
                if (nextPnl > 0) {
                    const days = (new Date(sorted[j].closedAt!).getTime() - new Date(sorted[i].closedAt!).getTime()) / (24 * 60 * 60 * 1000);
                    recoveryTimes.push(days);
                    break;
                }
            }
        }
    }

    return recoveryTimes.length > 0 ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length : 0;
}

function calculateMonthlyProfitFactors(positions: Position[]): number[] {
    const byMonth: Record<string, Position[]> = {};

    positions.forEach(p => {
        const month = new Date(p.closedAt!).toISOString().substring(0, 7); // YYYY-MM
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(p);
    });

    return Object.values(byMonth).map(trades => {
        const wins = trades.filter(t => parseFloat(t.realizedPnL || '0') > 0);
        const losses = trades.filter(t => parseFloat(t.realizedPnL || '0') < 0);

        const totalWins = wins.reduce((sum, t) => sum + parseFloat(t.realizedPnL || '0'), 0);
        const totalLosses = Math.abs(losses.reduce((sum, t) => sum + parseFloat(t.realizedPnL || '0'), 0));

        return totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 1;
    });
}

function getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7);
    return `${year}-W${week}`;
}

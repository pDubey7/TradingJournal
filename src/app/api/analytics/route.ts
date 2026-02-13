import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { positions, executions, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateCompleteAnalytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

// GET /api/analytics
// Returns complete analytics for the logged-in user's account
export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get user's account
        const account = await db.query.accounts.findFirst({
            where: eq(accounts.userId, session.userId),
        });

        if (!account) {
            return NextResponse.json({
                core: {
                    grossPnL: 0,
                    netPnL: 0,
                    totalFees: 0,
                    totalVolume: 0,
                    tradeCount: 0
                },
                winRate: {
                    winRate: 0,
                    lossRate: 0,
                    breakevenRate: 0,
                    winCount: 0,
                    lossCount: 0,
                    breakevenCount: 0,
                    totalTrades: 0
                },
                expectancy: 0,
                avgWinLoss: { avgWin: 0, avgLoss: 0, winLossRatio: 0 },
                longShort: { longCount: 0, shortCount: 0, longPnL: 0, shortPnL: 0, countRatio: 0, pnlRatio: 0 },
                duration: { avgDurationSeconds: 0, avgDurationHours: 0, avgDurationDays: 0, medianDurationSeconds: 0, shortestTrade: 0, longestTrade: 0 },
                extremes: { largestGain: 0, largestLoss: 0, largestGainSymbol: '-', largestLossSymbol: '-' },
                volumeAndFees: { totalVolume: 0, totalFees: 0, feePercentOfPnL: 0, feePercentOfVolume: 0, avgFeePerTrade: 0, makerFees: 0, takerFees: 0 },
                equityCurve: [],
                drawdown: { maxDrawdown: 0, maxDrawdownValue: 0, currentDrawdown: 0 },
                dailyPerformance: [],
                hourlyPerformance: [],
                orderTypePerformance: [],
                riskScore: {
                    overall: 0,
                    level: 'CONSERVATIVE',
                    components: {
                        drawdownSeverity: 0,
                        positionSizingConsistency: 0,
                        overtradingIndex: 0,
                        winStreakVolatility: 0,
                        feeBurnRate: 0
                    },
                    recommendation: 'Not enough data to calculate risk score.'
                },
                overtradingSignals: [],
                consistencyScore: {
                    overall: 0,
                    components: {
                        winRateStability: 0,
                        pnlVariance: 0,
                        tradeFrequencyRegularity: 0,
                        drawdownRecoveryTime: 0,
                        profitFactorStability: 0
                    },
                    recommendation: 'Need more data to calculate consistency score.'
                },
                capitalEfficiency: {
                    score: 0,
                    level: 'INEFFICIENT',
                    totalCapitalDeployed: 0,
                    netPnL: 0,
                    recommendation: 'No closed positions to analyze.'
                }
            });
        }

        const userPositions = await db.query.positions.findMany({
            where: eq(positions.accountId, account.id),
        });

        const userExecutions = await db.query.executions.findMany({
            where: eq(executions.accountId, account.id),
        });

        // Get starting balance from query params or use default
        const startingBalance = parseFloat(
            req.nextUrl.searchParams.get('startingBalance') || '10000'
        );

        // Calculate all analytics
        const analytics = calculateCompleteAnalytics(
            userPositions as any,
            userExecutions as any,
            startingBalance
        );

        return NextResponse.json(analytics);
    } catch (error) {
        console.error('Analytics calculation failed:', error);
        return NextResponse.json(
            { error: 'Failed to calculate analytics' },
            { status: 500 }
        );
    }
}

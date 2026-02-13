
import { CompleteAnalytics } from './types';

export const DEMO_ANALYTICS: CompleteAnalytics = {
    core: {
        grossPnL: 15420.50,
        netPnL: 14250.20,
        totalFees: 1170.30,
        totalVolume: 2500000,
        tradeCount: 142
    },
    winRate: {
        winRate: 65.5,
        lossRate: 34.5,
        breakevenRate: 0,
        winCount: 93,
        lossCount: 49,
        breakevenCount: 0,
        totalTrades: 142
    },
    avgWinLoss: {
        avgWin: 450.20,
        avgLoss: -210.50,
        winLossRatio: 2.14
    },
    longShort: {
        longCount: 85,
        shortCount: 57,
        longPnL: 8500.50,
        shortPnL: 5750.00,
        countRatio: 1.49,
        pnlRatio: 1.48
    },
    duration: {
        avgDurationSeconds: 14400, // 4 hours
        avgDurationHours: 4,
        avgDurationDays: 0.17,
        medianDurationSeconds: 7200,
        shortestTrade: 300,
        longestTrade: 259200
    },
    extremes: {
        largestGain: 2500.00,
        largestLoss: -850.00,
        largestGainSymbol: 'SOL-PERP',
        largestLossSymbol: 'BTC-PERP',
        largestGainDate: new Date(),
        largestLossDate: new Date()
    },
    volumeAndFees: {
        totalVolume: 2500000,
        totalFees: 1170.30,
        feePercentOfPnL: 8.2,
        feePercentOfVolume: 0.047,
        avgFeePerTrade: 8.24,
        makerFees: 450.10,
        takerFees: 720.20
    },
    expectancy: 100.35,
    equityCurve: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
        equity: 10000 + (Math.random() * 5000 * (i / 30)),
        cumulativePnL: Math.random() * 5000 * (i / 30),
        tradeNumber: i * 5
    })),
    drawdown: {
        maxDrawdown: 12.5,
        maxDrawdownValue: 1500,
        currentDrawdown: 2.5,
        maxDrawdownDate: new Date()
    },
    dailyPerformance: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pnl: Math.random() * 1000 - 200,
        volume: Math.random() * 50000,
        tradeCount: Math.floor(Math.random() * 10) + 1,
        winRate: Math.random() * 100
    })),
    hourlyPerformance: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        pnl: Math.random() * 500 - 100,
        tradeCount: Math.floor(Math.random() * 5),
        avgPnL: Math.random() * 100 - 20,
        winRate: Math.random() * 100
    })),
    orderTypePerformance: [
        { orderType: 'MARKET', pnl: 5200, tradeCount: 80, winRate: 60, avgPnL: 65 },
        { orderType: 'LIMIT', pnl: 9050, tradeCount: 62, winRate: 72, avgPnL: 145 }
    ],
    riskScore: {
        overall: 85,
        level: 'BALANCED',
        components: {
            drawdownSeverity: 80,
            positionSizingConsistency: 90,
            overtradingIndex: 85,
            winStreakVolatility: 75,
            feeBurnRate: 95
        },
        recommendation: 'Excellent risk management. Maintain current sizing.'
    },
    overtradingSignals: [],
    consistencyScore: {
        overall: 78,
        components: {
            winRateStability: 75,
            pnlVariance: 80,
            tradeFrequencyRegularity: 70,
            drawdownRecoveryTime: 85,
            profitFactorStability: 80
        },
        recommendation: 'Consistent performance. Good recovery from drawdowns.'
    },
    capitalEfficiency: {
        score: 82,
        level: 'GOOD',
        totalCapitalDeployed: 150000,
        netPnL: 14250.20,
        recommendation: 'Capital is being deployed efficiently.'
    }
};

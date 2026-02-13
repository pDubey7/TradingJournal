// Analytics Type Definitions

export interface Position {
    id: string;
    accountId: string;
    symbol: string;
    status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
    side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
    openedAt: Date;
    closedAt?: Date;
    avgEntryPrice: string;
    avgExitPrice?: string;
    maxSize: string;
    totalVolume: string;
    totalFees: string;
    realizedPnL?: string;
    holdingPeriodSeconds?: string;
    rMultiple?: string;
}

export interface Execution {
    id: string;
    accountId: string;
    positionId?: string;
    sig: string;
    blockTime: Date;
    symbol: string;
    side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
    type: 'SPOT' | 'PERP' | 'OPTION';
    price: string;
    size: string;
    notional: string;
    fee: string;
    feeAsset?: string;
    isMaker: boolean;
    orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'LIQUIDATION';
}

// Core Metrics
export interface CoreMetrics {
    grossPnL: number;
    netPnL: number;
    totalFees: number;
    totalVolume: number;
    tradeCount: number;
}

export interface WinRateMetrics {
    winRate: number;
    lossRate: number;
    breakevenRate: number;
    winCount: number;
    lossCount: number;
    breakevenCount: number;
    totalTrades: number;
}

export interface AvgWinLoss {
    avgWin: number;
    avgLoss: number;
    winLossRatio: number;
}

export interface LongShortMetrics {
    longCount: number;
    shortCount: number;
    longPnL: number;
    shortPnL: number;
    countRatio: number;
    pnlRatio: number;
}

export interface DurationMetrics {
    avgDurationSeconds: number;
    avgDurationHours: number;
    avgDurationDays: number;
    medianDurationSeconds: number;
    shortestTrade: number;
    longestTrade: number;
}

export interface ExtremeMetrics {
    largestGain: number;
    largestLoss: number;
    largestGainSymbol: string;
    largestLossSymbol: string;
    largestGainDate?: Date;
    largestLossDate?: Date;
}

export interface VolumeAndFees {
    totalVolume: number;
    totalFees: number;
    feePercentOfPnL: number;
    feePercentOfVolume: number;
    avgFeePerTrade: number;
    makerFees: number;
    takerFees: number;
}

export interface EquityPoint {
    timestamp: Date;
    equity: number;
    cumulativePnL: number;
    tradeNumber: number;
}

export interface DrawdownMetrics {
    maxDrawdown: number;
    maxDrawdownValue: number;
    currentDrawdown: number;
    maxDrawdownDate?: Date;
}

export interface DailyStats {
    date: string;
    pnl: number;
    volume: number;
    tradeCount: number;
    winRate: number;
}

export interface HourlyStats {
    hour: number;
    pnl: number;
    tradeCount: number;
    avgPnL: number;
    winRate: number;
}

export interface OrderTypeStats {
    orderType: string;
    pnl: number;
    tradeCount: number;
    winRate: number;
    avgPnL: number;
}

export interface CompleteAnalytics {
    core: CoreMetrics;
    winRate: WinRateMetrics;
    avgWinLoss: AvgWinLoss;
    longShort: LongShortMetrics;
    duration: DurationMetrics;
    extremes: ExtremeMetrics;
    volumeAndFees: VolumeAndFees;
    expectancy: number;
    equityCurve: EquityPoint[];
    drawdown: DrawdownMetrics;
    dailyPerformance: DailyStats[];
    hourlyPerformance: HourlyStats[];
    orderTypePerformance: OrderTypeStats[];

    // Advanced Metrics
    riskScore: RiskScore;
    overtradingSignals: OvertradingSignal[];
    consistencyScore: ConsistencyScore;
    capitalEfficiency: CapitalEfficiency;
}

// Advanced Analytics Types
export interface RiskScore {
    overall: number;
    level: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' | 'RECKLESS';
    components: {
        drawdownSeverity: number;
        positionSizingConsistency: number;
        overtradingIndex: number;
        winStreakVolatility: number;
        feeBurnRate: number;
    };
    recommendation: string;
}

export interface OvertradingSignal {
    type: 'REVENGE_TRADING' | 'CHASING' | 'FATIGUE_TRADING' | 'FOMO_CLUSTERING';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    message: string;
    data?: any;
}

export interface ConsistencyScore {
    overall: number;
    components: {
        winRateStability: number;
        pnlVariance: number;
        tradeFrequencyRegularity: number;
        drawdownRecoveryTime: number;
        profitFactorStability: number;
    };
    recommendation: string;
}

export interface CapitalEfficiency {
    score: number;
    level: 'INEFFICIENT' | 'AVERAGE' | 'GOOD' | 'EXCELLENT';
    totalCapitalDeployed: number;
    netPnL: number;
    recommendation: string;
}

export interface AdvancedAnalytics {
    riskScore: RiskScore;
    overtradingSignals: OvertradingSignal[];
    consistencyScore: ConsistencyScore;
    capitalEfficiency: CapitalEfficiency;
}

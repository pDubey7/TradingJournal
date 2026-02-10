import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { positions, executions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
    calculateRiskScore,
    detectOvertrading,
    calculateConsistencyScore,
    calculateCapitalEfficiency,
    type AdvancedAnalytics
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

// GET /api/analytics/advanced
// Returns advanced analytics (Risk Score, Overtrading Detection, etc.)
export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get user's positions and executions
        const userPositions = await db.query.positions.findMany({
            where: eq(positions.accountId, session.userId),
        });

        const userExecutions = await db.query.executions.findMany({
            where: eq(executions.accountId, session.userId),
        });

        // Get account balance from query params or use default
        const accountBalance = parseFloat(
            req.nextUrl.searchParams.get('accountBalance') || '10000'
        );

        // Calculate advanced analytics
        const riskScore = calculateRiskScore(
            userPositions as any,
            userExecutions as any,
            accountBalance
        );

        const overtradingSignals = detectOvertrading(userPositions as any);

        const consistencyScore = calculateConsistencyScore(userPositions as any);

        const capitalEfficiency = calculateCapitalEfficiency(
            userPositions as any,
            userExecutions as any
        );

        const advanced: AdvancedAnalytics = {
            riskScore,
            overtradingSignals,
            consistencyScore,
            capitalEfficiency,
        };

        return NextResponse.json(advanced);
    } catch (error) {
        console.error('Advanced analytics calculation failed:', error);
        return NextResponse.json(
            { error: 'Failed to calculate advanced analytics' },
            { status: 500 }
        );
    }
}

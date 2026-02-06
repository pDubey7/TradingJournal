import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { positions, executions } from '@/db/schema';
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
        // Get user's account (for now, assume first account)
        // In production, you'd get accountId from query params
        const userPositions = await db.query.positions.findMany({
            where: eq(positions.accountId, session.userId), // Simplified: using userId as accountId
        });

        const userExecutions = await db.query.executions.findMany({
            where: eq(executions.accountId, session.userId),
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

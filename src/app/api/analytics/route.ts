import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/db';
import { positions, executions, accounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculateCompleteAnalytics } from '@/lib/analytics';
import { DEMO_ANALYTICS } from '@/lib/analytics/demo-data';

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
            return NextResponse.json({ ...DEMO_ANALYTICS, isDemo: true });
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

        if (userPositions.length === 0 && userExecutions.length === 0) {
            return NextResponse.json({ ...DEMO_ANALYTICS, isDemo: true });
        }

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

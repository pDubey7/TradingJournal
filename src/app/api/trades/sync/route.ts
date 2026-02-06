import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { syncWalletTrades } from '@/lib/solana/fetcher';

export const dynamic = 'force-dynamic';

// GET /api/trades/sync
// Triggers a sync for the logged-in user
export async function GET(req: NextRequest) {
    const session = getSession(req);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await syncWalletTrades(session.userId, session.walletAddress);
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        console.error('Sync failed:', error);
        return NextResponse.json({ error: 'Failed to sync trades' }, { status: 500 });
    }
}

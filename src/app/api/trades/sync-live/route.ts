import { NextRequest, NextResponse } from 'next/server';
import { syncDevnetTrades } from '@/lib/deriverse/sync';

export const dynamic = 'force-dynamic';

// POST /api/trades/sync-live
// Syncs live devnet trades for a wallet
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'walletAddress is required' },
                { status: 400 }
            );
        }

        const newTrades = await syncDevnetTrades(walletAddress);

        return NextResponse.json({ newTrades });
    } catch (error: any) {
        console.error('Sync-live failed:', error);
        return NextResponse.json(
            { error: 'Failed to sync trades', details: error.message },
            { status: 500 }
        );
    }
}

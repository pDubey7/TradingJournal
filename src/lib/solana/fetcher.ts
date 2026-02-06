import { Connection, PublicKey, ConfirmedSignatureInfo, ParsedTransactionWithMeta } from '@solana/web3.js';
import { db } from '@/db';
import { trades } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { parseTransaction } from './parser';

// Use a public RPC or specific env one
const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com');

export async function syncWalletTrades(userId: string, walletAddress: string) {
    // 1. Get latest signature we have synced to stop "backfilling" early
    const latestTrade = await db.query.trades.findFirst({
        where: eq(trades.userId, userId),
        orderBy: [desc(trades.blockTime)],
    });

    const untilSignature = latestTrade?.signature;

    // 2. Fetch Signatures (Pagination)
    // We limit to 50 for this demo to avoid long waits/rate limits without API keys
    const LIMIT = 50;

    let options: any = { limit: LIMIT };
    if (untilSignature) {
        options.until = untilSignature;
    }

    const signaturesInfo = await connection.getSignaturesForAddress(
        new PublicKey(walletAddress),
        options
    );

    if (signaturesInfo.length === 0) return { count: 0 };

    // 3. Batched Transaction Fetching
    // getParsedTransactions limits vary by RPC, safe bet is 10-25
    const signatures = signaturesInfo.map(s => s.signature);

    // Note: getParsedTransactions might drop some if older than retention policy of RPC
    // but for "recents" it is fine.
    const txs = await connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
    });

    // 4. Parse & Upsert
    let newTradesCount = 0;

    // Process in reverse (oldest first) so if we fail we have continuous history? 
    // Actually, usually we want newest first for UI, but for consistent history...
    // Let's just process all.

    for (const tx of txs) {
        if (!tx) continue;

        const tradeData = parseTransaction(tx, userId, walletAddress);
        if (tradeData) {
            // Use ON CONFLICT DO NOTHING in generic SQL, or check existence using Drizzle 
            // Drizzle's upsert support depends on driver, let's just insert for now 
            // assuming we logic'd the paginiation correctly.
            try {
                await db.insert(trades).values(tradeData).onConflictDoNothing();
                newTradesCount++;
            } catch (e) {
                console.error('Failed to insert trade', e);
            }
        }
    }

    return { count: newTradesCount };
}

import { ParsedTransactionWithMeta, Connection, PublicKey } from '@solana/web3.js';
import { trades } from '@/db/schema';
import { InferInsertModel } from 'drizzle-orm';

// Dummy ID for Deriverse Program
const DERIVERSE_PROGRAM_ID = 'Deriv...';

export type TradeInsert = InferInsertModel<typeof trades>;

export function parseTransaction(
    tx: ParsedTransactionWithMeta,
    userId: string,
    walletAddress: string
): TradeInsert | null {
    if (!tx.meta || tx.meta.err) return null;

    const signature = tx.transaction.signatures[0];
    const blockTime = new Date((tx.blockTime || 0) * 1000);
    const slot = tx.slot.toString();

    // HEURISTIC: In a real app, we parse Inner Instructions for specific Event Logs.
    // For this architecture demo, we will identify SOL transfers or mocked "Trade" logs.

    // Logic: Calculate Net Balance Change for the user to determine Size/Side (Simplified)
    // Find the account index for the user's wallet
    const accountIndex = tx.transaction.message.accountKeys.findIndex(
        (key) => key.pubkey.toBase58() === walletAddress
    );

    if (accountIndex === -1) return null;

    const preBalance = tx.meta.preBalances[accountIndex];
    const postBalance = tx.meta.postBalances[accountIndex];
    const diff = postBalance - preBalance;

    // If negligible change, ignore (gas only)
    if (Math.abs(diff) < 5000) return null;

    const isBuy = diff < 0; // If balance decreased, we "spent" SOL (Buy) - Simplified view

    return {
        userId,
        signature,
        blockTime,
        slot,
        asset: 'SOL-PERP', // Mock asset
        side: isBuy ? 'LONG' : 'SHORT',
        size: (Math.abs(diff) / 1e9).toString(), // Convert Lamports to SOL
        price: '145.20', // Mock price, in reality would be parsed from logs
        pnl: '0', // Realized PnL would be calculated from closing events
        fee: (tx.meta.fee / 1e9).toString(),
        source: 'Deriverse',
    };
}

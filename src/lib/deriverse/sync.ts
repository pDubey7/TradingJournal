import { Connection, PublicKey } from '@solana/web3.js';
import { db } from '@/db';
import { onchainTrades } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Beth_Ellen } from 'next/font/google';

const PROGRAM_ID = 'CDESjex4EDBKLwx9ZPzVbjiHEHatasb5fhSJZMzNfvw2';
const LAMPORTS_PER_SOL = 1_000_000_000;

export async function syncDevnetTrades(walletAddress: string): Promise<number> {
    try {
        // Use env variable with fallback
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');

        const walletPubkey = new PublicKey(walletAddress);
        const programPubkey = new PublicKey(PROGRAM_ID);

        // Get last stored signature for incremental sync
        const lastStoredTrade = await db.query.onchainTrades.findFirst({
            where: eq(onchainTrades.wallet, walletAddress),
            orderBy: [desc(onchainTrades.timestamp)],
        });

        // Fetch signatures (limit 150)
        const signatures = await connection.getSignaturesForAddress(
            walletPubkey,
            { limit: 150 },
            'confirmed'
        );

        let newTradesCount = 0;
        const tradesToInsert = [];

        for (const sigInfo of signatures) {
            const signature = sigInfo.signature;

            // Stop if we encounter already stored signature (incremental sync)
            if (lastStoredTrade && signature === lastStoredTrade.signature) {
                break;
            }

            // Get parsed transaction
            const tx = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!tx || !tx.meta) continue;

            // Check if PROGRAM_ID exists in accountKeys
            const accountKeys = tx.transaction.message.accountKeys;
            const programExists = accountKeys.some(
                (key) => key.pubkey.toBase58() === PROGRAM_ID
            );

            if (!programExists) continue;

            // Find wallet index in accountKeys
            const walletIndex = accountKeys.findIndex(
                (key) => key.pubkey.toBase58() === walletAddress
            );

            if (walletIndex === -1) continue;

            // Extract balances
            const preBalance = tx.meta.preBalances[walletIndex] || 0;
            const postBalance = tx.meta.postBalances[walletIndex] || 0;
            const fee = tx.meta.fee || 0;

            // Calculate PnL: (post - pre - fee) in SOL
            const pnlLamports = postBalance - preBalance - fee;
            const pnlSol = pnlLamports / LAMPORTS_PER_SOL;
            const feeSol = fee / LAMPORTS_PER_SOL;

            // Determine direction
            let direction = null;
            if (pnlLamports > 0) direction = 'LONG';
            else if (pnlLamports < 0) direction = 'SHORT';

            tradesToInsert.push({
                wallet: walletAddress,
                signature,
                timestamp: new Date((sigInfo.blockTime || 0) * 1000),
                fee: feeSol.toString(),
                pnlEstimate: pnlSol.toString(),
                direction,
                source: 'devnet-live',
            });
        }

        // Insert trades (ignore duplicates via unique constraint)
        if (tradesToInsert.length > 0) {
            for (const trade of tradesToInsert) {
                try {
                    await db.insert(onchainTrades).values(trade);
                    newTradesCount++;
                } catch (error: any) {
                    // Ignore duplicate signature errors
                    if (!error.message?.includes('unique')) {
                        console.error('Error inserting trade:', error);
                    }
                }
            }
        }

        return newTradesCount;
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}
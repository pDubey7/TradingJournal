import dotenv from 'dotenv';
import path from 'path';

// Load env vars BEFORE importing db
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function seed(walletAddress: string) {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import('@/db');
    const { accounts, executions, positions, snapshots, users } = await import('@/db/schema');

    if (!walletAddress) {
        console.error('Please provide a wallet address as the first argument.');
        process.exit(1);
    }

    console.log(`Seeding data for wallet: ${walletAddress}`);

    // 1. Get or Create User
    let user = await db.query.users.findFirst({
        where: eq(users.walletAddress, walletAddress),
    });

    if (!user) {
        console.log('User not found. Creating new user...');
        const result = await db.insert(users).values({
            walletAddress: walletAddress,
            email: `seed-${walletAddress.slice(0, 8)}@example.com`,
        }).returning();
        user = result[0];
    }

    // 2. Get or Create Account
    let account = await db.query.accounts.findFirst({
        where: eq(accounts.userId, user.id),
    });

    if (!account) {
        console.log('Account not found. Creating new account...');
        const result = await db.insert(accounts).values({
            userId: user.id,
            name: 'Main Wallet',
            address: walletAddress,
            platform: 'SOLANA_DEX',
        }).returning();
        account = result[0];
    }

    console.log(`Using account: ${account.id}`);

    // 2. Create Sample Data
    const tokens = ['SOL', 'BTC', 'ETH', 'JUP'];
    const now = new Date();

    // Create 20 Positions (Mix of Open/Closed)
    for (let i = 0; i < 20; i++) {
        const symbol = tokens[Math.floor(Math.random() * tokens.length)] + '-PERP';
        const isWin = Math.random() > 0.4; // 60% win rate
        const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
        const entryPrice = Math.random() * 100 + 10;
        const size = Math.random() * 10
        const notional = entryPrice * size;

        const openedAt = new Date(now.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Within last 30 days
        const closedAt = Math.random() > 0.2 ? new Date(openedAt.getTime() + (Math.random() * 24 * 60 * 60 * 1000)) : null; // 80% closed

        let exitPrice = null;
        let pnl = null;
        let fees = notional * 0.0005; // 0.05% fee

        if (closedAt) {
            const move = isWin ? (Math.random() * 0.1) : -(Math.random() * 0.05);
            exitPrice = side === 'LONG' ? entryPrice * (1 + move) : entryPrice * (1 - move);
            pnl = (side === 'LONG' ? (exitPrice - entryPrice) : (entryPrice - exitPrice)) * size;
            pnl -= fees; // Net PnL
        }

        const positionId = uuidv4();

        // Insert Position
        await db.insert(positions).values({
            id: positionId,
            accountId: account.id,
            symbol,
            status: closedAt ? 'CLOSED' : 'OPEN',
            side,
            openedAt,
            closedAt,
            avgEntryPrice: entryPrice.toFixed(4),
            avgExitPrice: exitPrice ? exitPrice.toFixed(4) : null,
            maxSize: size.toFixed(4),
            totalVolume: (notional * (closedAt ? 2 : 1)).toFixed(4),
            totalFees: fees.toFixed(4),
            realizedPnL: pnl ? pnl.toFixed(4) : null,
            holdingPeriodSeconds: closedAt ? ((closedAt.getTime() - openedAt.getTime()) / 1000).toFixed(0) : null,
        });

        // Insert Executions (Entry)
        await db.insert(executions).values({
            accountId: account.id,
            positionId: positionId,
            sig: `sig-${Math.random().toString(36).substring(7)}`,
            blockTime: openedAt,
            symbol,
            side: side === 'LONG' ? 'BUY' : 'SELL',
            price: entryPrice.toFixed(4),
            size: size.toFixed(4),
            notional: notional.toFixed(4),
            fee: (fees / 2).toFixed(4),
        });

        // Insert Executions (Exit if closed)
        if (closedAt && exitPrice) {
            await db.insert(executions).values({
                accountId: account.id,
                positionId: positionId,
                sig: `sig-${Math.random().toString(36).substring(7)}`,
                blockTime: closedAt,
                symbol,
                side: side === 'LONG' ? 'SELL' : 'BUY',
                price: exitPrice.toFixed(4),
                size: size.toFixed(4),
                notional: (exitPrice * size).toFixed(4),
                fee: (fees / 2).toFixed(4),
            });
        }
    }

    // 3. Create Snapshots (Daily Equity)
    let equity = 10000;
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        date.setHours(0, 0, 0, 0);

        // Random daily fluctuation
        const dailyPnL = (Math.random() - 0.45) * 500; // Slight upward bias
        equity += dailyPnL;

        await db.insert(snapshots).values({
            accountId: account.id,
            timestamp: date,
            equity: equity.toFixed(2),
            availableBal: equity.toFixed(2), // Simplified
            dayPnL: dailyPnL.toFixed(2),
            dayVolume: (Math.random() * 10000).toFixed(2),
        }).onConflictDoNothing();
    }

    console.log('Seeding complete! Refresh your dashboard.');
    process.exit(0);
}

const args = process.argv.slice(2);
seed(args[0]).catch(console.error);

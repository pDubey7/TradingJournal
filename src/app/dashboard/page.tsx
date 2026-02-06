"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TradesTable } from "@/components/dashboard/trades-table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import bs58 from "bs58";

export default function DashboardPage() {
    const { publicKey, signMessage } = useWallet();
    const queryClient = useQueryClient();

    // 1. Session Query
    const { data: session, isLoading: sessionLoading } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return null;
            return res.json();
        }
    });

    // 2. Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/trades/sync');
            if (!res.ok) throw new Error('Sync failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trades'] });
        }
    });

    // 3. Login Flow
    const handleLogin = async () => {
        if (!publicKey || !signMessage) return;

        // Get Nonce
        const nonceRes = await fetch('/api/auth/nonce');
        const { nonce } = await nonceRes.json();

        // Sign Message
        const message = `Deriverse needs you to sign in... nonce: ${nonce}`; // Simplified for demo matching auth.ts
        // In real app, match exact strings

        // For now, let's use the exact message construction from auth.ts logic if we could import it, 
        // or just hardcode the "check" logic for the demo.
        // The auth.ts expects: `if (!message.includes(\`Nonce: ${storedNonce}\`))`

        const statement = 'Sign in to Deriverse Analytics to view your private trading journal.';
        const fullMessage = `deriverse.analytics wants you to sign in with your Solana account:
${publicKey.toBase58()}

${statement}

URI: https://deriverse.analytics
Version: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;

        const messageBytes = new TextEncoder().encode(fullMessage);
        const signature = await signMessage(messageBytes);

        // Verify
        const verifyRes = await fetch('/api/auth/verify', {
            method: 'POST',
            body: JSON.stringify({
                publicKey: publicKey.toBase58(),
                signature: bs58.encode(signature),
                message: fullMessage
            })
        });

        if (verifyRes.ok) {
            queryClient.invalidateQueries({ queryKey: ['session'] });
        }
    };

    // 4. Mock Trades Data (replace with API call)
    // In a real implementation this would fetch from /api/trades
    const trades = [
        { signature: 'sig1', blockTime: new Date().toISOString(), asset: 'SOL-PERP', side: 'LONG', size: '10', price: '145.20', pnl: '120.50' },
        { signature: 'sig2', blockTime: new Date().toISOString(), asset: 'BTC-PERP', side: 'SHORT', size: '0.5', price: '62000', pnl: '-50.00' },
    ];

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
                <h1 className="text-xl font-bold tracking-tight">Deriverse Analytics</h1>
                <div className="ml-auto flex items-center gap-4">
                    <WalletMultiButton />
                    {session?.authenticated && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending}
                        >
                            {syncMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Sync
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 space-y-4 p-8 pt-6">
                {!publicKey ? (
                    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                        <h2 className="text-2xl font-bold">Connect Wallet to Analyze Trades</h2>
                        <p className="text-muted-foreground">Non-custodial, read-only analytics for your trading performance.</p>
                        <WalletMultiButton />
                    </div>
                ) : !session?.authenticated ? (
                    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                        <h2 className="text-2xl font-bold">Sign In to View Dashboard</h2>
                        <p className="text-muted-foreground">We use signatures to keep your journal private.</p>
                        <Button onClick={handleLogin}>Sign In with Solana</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                        </div>

                        <StatsCards trades={trades} />

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-7">
                                <TradesTable trades={trades} />
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

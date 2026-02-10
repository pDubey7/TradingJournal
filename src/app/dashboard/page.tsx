"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { ClientWalletButton } from "@/components/client-wallet-button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import bs58 from "bs58";

// Dashboard Components
import { HeroMetrics } from "@/components/dashboard/hero-metrics";
import { DashboardFilters } from "@/components/dashboard/filters";
import { EquityCurveChart } from "@/components/dashboard/equity-curve";
import { DrawdownChart } from "@/components/dashboard/drawdown-chart";
import { LongShortCard } from "@/components/dashboard/long-short-card";
import { TimePerformanceCard } from "@/components/dashboard/time-performance-card";
import { FeeAnalysisCard } from "@/components/dashboard/fee-analysis-card";
import { TradingJournalTable } from "@/components/dashboard/trading-journal-table";

import type { CompleteAnalytics } from "@/lib/analytics";

export default function DashboardPage() {
    const { publicKey, signMessage } = useWallet();
    const queryClient = useQueryClient();

    // Session Query
    const { data: session, isLoading: sessionLoading } = useQuery({
        queryKey: ['session'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return null;
            return res.json();
        }
    });

    // Analytics Query
    const { data: analytics, isLoading: analyticsLoading } = useQuery<CompleteAnalytics>({
        queryKey: ['analytics'],
        queryFn: async () => {
            const res = await fetch('/api/analytics');
            if (!res.ok) throw new Error('Failed to fetch analytics');
            return res.json();
        },
        enabled: !!session?.authenticated,
    });

    // Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/trades/sync');
            if (!res.ok) throw new Error('Sync failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        }
    });

    // Login Flow
    const handleLogin = async () => {
        if (!publicKey || !signMessage) return;

        try {
            // Get Nonce
            const nonceRes = await fetch('/api/auth/nonce');
            const { nonce } = await nonceRes.json();

            // Create SIWS message
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicKey: publicKey.toBase58(),
                    signature: bs58.encode(signature),
                    message: fullMessage
                })
            });

            if (verifyRes.ok) {
                queryClient.invalidateQueries({ queryKey: ['session'] });
            }
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    // Filter handler
    const handleFilterChange = (filters: any) => {
        console.log('Filters changed:', filters);
        // TODO: Implement filtering logic
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
                <h1 className="text-xl font-bold tracking-tight">📊 Deriverse Analytics</h1>
                <div className="ml-auto flex items-center gap-4">
                    {session?.authenticated && (
                        <>
                            <span className="text-sm text-muted-foreground">
                                Last Sync: {syncMutation.isSuccess ? 'Just now' : '2 min ago'}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncMutation.mutate()}
                                disabled={syncMutation.isPending}
                            >
                                {syncMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Sync
                            </Button>
                        </>
                    )}
                    <ClientWalletButton />
                </div>
            </header>

            <main className="flex-1">
                {!publicKey ? (
                    // Not Connected
                    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4 p-8">
                        <h2 className="text-3xl font-bold">Connect Wallet to Analyze Trades</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Non-custodial, read-only analytics for your trading performance on Deriverse.
                        </p>
                        <ClientWalletButton />
                    </div>
                ) : !session?.authenticated ? (
                    // Not Signed In
                    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4 p-8">
                        <h2 className="text-3xl font-bold">Sign In to View Dashboard</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            We use wallet signatures to keep your journal private and secure.
                        </p>
                        <Button onClick={handleLogin} size="lg">
                            Sign In with Solana
                        </Button>
                    </div>
                ) : analyticsLoading ? (
                    // Loading
                    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : analytics ? (
                    // Dashboard Content
                    <div className="space-y-6 p-6">
                        {/* Hero Metrics */}
                        <HeroMetrics
                            core={analytics.core}
                            winRate={analytics.winRate}
                            expectancy={analytics.expectancy}
                        />

                        {/* Filters */}
                        <DashboardFilters onFilterChange={handleFilterChange} />

                        {/* Charts Row */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <EquityCurveChart
                                data={analytics.equityCurve}
                                startingBalance={10000}
                            />
                            <DrawdownChart
                                equityCurve={analytics.equityCurve}
                                metrics={analytics.drawdown}
                            />
                        </div>

                        {/* Performance Breakdown */}
                        <div className="grid gap-6 md:grid-cols-3">
                            <LongShortCard metrics={analytics.longShort} />
                            <TimePerformanceCard hourlyData={analytics.hourlyPerformance} />
                            <FeeAnalysisCard metrics={analytics.volumeAndFees} />
                        </div>

                        {/* Trading Journal */}
                        <TradingJournalTable trades={[]} />
                    </div>
                ) : (
                    // Error State
                    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center space-y-4 p-8">
                        <h2 className="text-2xl font-bold">Failed to Load Analytics</h2>
                        <p className="text-muted-foreground">Please try refreshing the page.</p>
                        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['analytics'] })}>
                            Retry
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}

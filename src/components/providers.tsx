'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles for wallet adapter
// Moved to layout.tsx

export function Providers({ children }: { children: React.ReactNode }) {
    // Derived network based on environment variable or endpoint contents
    const network = useMemo(() => {
        if (process.env.NEXT_PUBLIC_SOLANA_NETWORK) return process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork;
        if (process.env.NEXT_PUBLIC_RPC_URL?.includes('devnet')) return WalletAdapterNetwork.Devnet;
        return WalletAdapterNetwork.Mainnet;
    }, []);

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // With on-chain data, we want some caching but not stale data forever.
                // 1 minute stale time seems reasonable for "sync" operations.
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        }
    }));

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <QueryClientProvider client={queryClient}>
                            {children}
                        </QueryClientProvider>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ThemeProvider>
    );
}

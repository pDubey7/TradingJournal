"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight, FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface Trade {
    id: string;
    symbol: string;
    side: string;
    size: string;
    avgEntryPrice: string;
    avgExitPrice?: string;
    realizedPnL?: string;
    openedAt: Date;
    closedAt?: Date;
    status: string;
}

interface TradingJournalTableProps {
    trades: Trade[];
}

export function TradingJournalTable({ trades }: TradingJournalTableProps) {
    const handleExport = () => {
        // TODO: Implement CSV export
        console.log('Exporting trades...');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Trading Journal</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Button size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Add Note
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Side</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                            <TableHead className="text-right">Entry</TableHead>
                            <TableHead className="text-right">Exit</TableHead>
                            <TableHead className="text-right">PnL</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trades.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <FileText className="h-8 w-8 mb-2" />
                                        <p>No trades found. Connect your wallet and sync to see your trading history.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            trades.map((trade) => {
                                const pnl = parseFloat(trade.realizedPnL || '0');
                                const isProfitable = pnl > 0;
                                const isLoss = pnl < 0;
                                const isLong = trade.side === 'LONG' || trade.side === 'BUY';

                                return (
                                    <TableRow key={trade.id} className="cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            {trade.closedAt
                                                ? format(new Date(trade.closedAt), 'MMM dd, HH:mm')
                                                : format(new Date(trade.openedAt), 'MMM dd, HH:mm')
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold">{trade.symbol}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={isLong ? "default" : "destructive"}
                                                className="gap-1"
                                            >
                                                {isLong ? (
                                                    <ArrowUpRight className="h-3 w-3" />
                                                ) : (
                                                    <ArrowDownRight className="h-3 w-3" />
                                                )}
                                                {trade.side}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {parseFloat(trade.size).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            ${parseFloat(trade.avgEntryPrice).toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {trade.avgExitPrice
                                                ? `$${parseFloat(trade.avgExitPrice).toFixed(2)}`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {trade.status === 'CLOSED' ? (
                                                <span
                                                    className={`font-bold font-mono ${isProfitable ? 'text-green-500' : isLoss ? 'text-red-500' : ''
                                                        }`}
                                                >
                                                    {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                                                </span>
                                            ) : (
                                                <Badge variant="outline">OPEN</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

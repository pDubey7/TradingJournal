import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export function TradesTable({ trades }: { trades: any[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Asset</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">PnL</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trades.map((trade) => (
                        <TableRow key={trade.signature}>
                            <TableCell>{format(new Date(trade.blockTime), 'MMM dd, HH:mm')}</TableCell>
                            <TableCell className="font-medium">{trade.asset}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded text-xs ${trade.side === 'LONG' || trade.side === 'BUY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {trade.side}
                                </span>
                            </TableCell>
                            <TableCell>{trade.size}</TableCell>
                            <TableCell>${trade.price}</TableCell>
                            <TableCell className={`text-right ${Number(trade.pnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {Number(trade.pnl) !== 0 ? `$${trade.pnl}` : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {trades.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No trades found. Sync your wallet!
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

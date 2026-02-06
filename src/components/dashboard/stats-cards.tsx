import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign } from "lucide-react";

export function StatsCards({ trades }: { trades: any[] }) {
    // Mock calculations - in real app would be robust
    const totalTrades = trades.length;
    const wins = trades.filter(t => parseFloat(t.pnl) > 0).length;
    const losses = trades.filter(t => parseFloat(t.pnl) < 0).length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;

    const totalPnL = trades.reduce((acc, t) => acc + parseFloat(t.pnl || '0'), 0).toFixed(2);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total PnL</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${parseFloat(totalPnL) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${totalPnL}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        +20.1% from last month
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <p className="text-xs text-muted-foreground">
                        {wins} Wins / {losses} Losses
                    </p>
                </CardContent>
            </Card>

            {/* More cards... */}
        </div>
    );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterState {
    symbol: string;
    dateRange: string;
    side: string;
    orderType: string;
    tags: string[];
}

interface DashboardFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        symbol: "all",
        dateRange: "30d",
        side: "all",
        orderType: "all",
        tags: [],
    });

    const updateFilter = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const removeTag = (tag: string) => {
        const newTags = filters.tags.filter(t => t !== tag);
        updateFilter("tags", newTags);
    };

    const dateRanges = [
        { value: "7d", label: "Last 7 Days" },
        { value: "30d", label: "Last 30 Days" },
        { value: "90d", label: "Last 90 Days" },
        { value: "ytd", label: "Year to Date" },
        { value: "all", label: "All Time" },
    ];

    return (
        <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex flex-wrap items-center gap-4 p-4">
                {/* Symbol Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Symbol:</span>
                    <Select value={filters.symbol} onValueChange={(v) => updateFilter("symbol", v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Symbols</SelectItem>
                            <SelectItem value="SOL">SOL</SelectItem>
                            <SelectItem value="BTC">BTC</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Date:</span>
                    <Select value={filters.dateRange} onValueChange={(v) => updateFilter("dateRange", v)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {dateRanges.map(range => (
                                <SelectItem key={range.value} value={range.value}>
                                    {range.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Side Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Side:</span>
                    <Select value={filters.side} onValueChange={(v) => updateFilter("side", v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sides</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Order Type Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Order Type:</span>
                    <Select value={filters.orderType} onValueChange={(v) => updateFilter("orderType", v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="market">Market</SelectItem>
                            <SelectItem value="limit">Limit</SelectItem>
                            <SelectItem value="stop">Stop</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Active Tags */}
                {filters.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Tags:</span>
                        <div className="flex gap-2">
                            {filters.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeTag(tag)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reset Filters */}
                {(filters.symbol !== "all" || filters.dateRange !== "30d" || filters.side !== "all" || filters.orderType !== "all" || filters.tags.length > 0) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            const resetFilters = {
                                symbol: "all",
                                dateRange: "30d",
                                side: "all",
                                orderType: "all",
                                tags: [],
                            };
                            setFilters(resetFilters);
                            onFilterChange(resetFilters);
                        }}
                    >
                        Reset Filters
                    </Button>
                )}
            </div>
        </div>
    );
}

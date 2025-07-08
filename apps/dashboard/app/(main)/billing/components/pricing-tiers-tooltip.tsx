"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Info } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface PricingTier {
    to: number | "inf";
    amount: number;
}

interface PricingTiersTooltipProps {
    tiers: PricingTier[];
    className?: string;
    showText?: boolean;
}

export function PricingTiersTooltip({ tiers, className, showText = true }: PricingTiersTooltipProps) {
    const formatTierRange = (tier: PricingTier, index: number) => {
        const prevTier = index > 0 ? tiers[index - 1] : null;
        const from = prevTier ? (typeof prevTier.to === 'number' ? prevTier.to + 1 : 0) : 0;
        const to = tier.to;

        const formatNumber = (num: number) => {
            if (num >= 1000000) {
                return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
            }
            if (num >= 1000) {
                return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}K`;
            }
            return num.toLocaleString();
        };

        if (to === "inf") {
            return `${formatNumber(from)}+`;
        }

        if (from === 0) {
            return `0 - ${formatNumber(typeof to === 'number' ? to : 0)}`;
        }

        return `${formatNumber(from)} - ${formatNumber(typeof to === 'number' ? to : 0)}`;
    };

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground cursor-help",
                        !showText && "rounded-full p-1 hover:bg-muted/50",
                        className
                    )}
                >
                    <Info size={12} />
                    {showText && <span>View pricing tiers</span>}
                </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80" side="top" align="start">
                <div className="space-y-3">
                    <div>
                        <h4 className="font-semibold text-sm">Tiered Pricing Structure</h4>
                        <p className="text-xs text-muted-foreground">
                            Lower rates for higher usage volumes
                        </p>
                    </div>
                    <div className="space-y-2">
                        {tiers.map((tier) => (
                            <div key={tier.to} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">
                                    {formatTierRange(tier, tiers.indexOf(tier))} events
                                </span>
                                <span className="font-mono font-medium">
                                    ${tier.amount.toFixed(6)} each
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                        You only pay the tier rate for usage within that range
                    </div>
                </div>
            </HoverCardContent>
        </HoverCard>
    );
} 
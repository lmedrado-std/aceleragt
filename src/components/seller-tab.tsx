
"use client";

import { Seller, Goals, Incentives } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { RankingMetric } from "./goal-getter-dashboard";

interface SellerTabProps {
    seller: Seller;
    goals: Goals;
    incentives: Incentives[string];
    rankings: Record<RankingMetric, number> | null;
    loading: boolean;
    themeColor?: string | null;
}

export function SellerTab({ seller, goals, incentives, rankings, loading, themeColor }: SellerTabProps) {
    return (
        <ProgressDisplay
            salesData={{
                vendas: seller.vendas,
                pa: seller.pa,
                ticketMedio: seller.ticketMedio,
                corridinhaDiaria: seller.corridinhaDiaria,
                ...goals
            }}
            incentives={incentives}
            rankings={rankings}
            loading={loading}
            themeColor={themeColor}
        />
    )
}

    
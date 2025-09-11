
"use client";

import { Seller, Goals, Incentives } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { RankingMetric, Rankings } from "./goal-getter-dashboard";

interface SellerTabProps {
    seller: Seller;
    goals: Goals;
    incentives: IncentiveProjectionOutput | null;
    rankings: Record<RankingMetric, number> | null;
}

export function SellerTab({ seller, goals, incentives, rankings }: SellerTabProps) {
    const salesData = {
        name: seller.name,
        vendas: seller.vendas,
        pa: seller.pa,
        ticketMedio: seller.ticket_medio,
        corridinhaDiaria: seller.corridinha_diaria,
        goals,
    };
    
    return (
        <ProgressDisplay 
            salesData={salesData} 
            incentives={incentives} 
            rankings={rankings}
        />
    )
}

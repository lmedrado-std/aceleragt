
"use client";

import { Seller, Goals, Incentives } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";

interface SellerTabProps {
    seller: Seller;
    goals: Goals;
    incentives: Incentives[string];
    themeColor?: string | null;
}

export function SellerTab({ seller, goals, incentives, themeColor }: SellerTabProps) {
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
            themeColor={themeColor}
        />
    )
}

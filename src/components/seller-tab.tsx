

"use client";

import { Seller, Goals, Incentives } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

interface SellerTabProps {
    seller: Seller;
    goals: Goals;
    incentives: IncentiveProjectionOutput | null;
}

export function SellerTab({ seller, goals, incentives }: SellerTabProps) {
    const salesData = {
        ...seller,
        goals,
    };
    
    return (
        <ProgressDisplay 
            salesData={salesData} 
            incentives={incentives} 
        />
    )
}

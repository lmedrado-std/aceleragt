
"use client";

import { Seller, Goals } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";

interface SellerTabProps {
    seller: Seller;
    goals: Goals;
}

export function SellerTab({ seller, goals }: SellerTabProps) {
    const salesData = {
        ...seller,
        goals,
    };
    
    return (
        <ProgressDisplay salesData={salesData} />
    )
}

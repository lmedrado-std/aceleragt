
"use client";

import { GoalGetterDashboard } from "@/components/goal-getter-dashboard";
import { useParams } from 'next/navigation';

export default function DashboardPage() {
    const params = useParams();
    const storeId = params.storeId as string;

    if (!storeId) {
        return <div>ID da loja não encontrado.</div>;
    }

    return (
        <main>
            <GoalGetterDashboard storeId={storeId} />
        </main>
    );
}

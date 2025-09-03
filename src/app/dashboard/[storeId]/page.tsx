"use client";

import { GoalGetterDashboard } from "@/components/goal-getter-dashboard";
import { useParams } from 'next/navigation';
import { Suspense } from "react";

function DashboardContent() {
    const params = useParams();
    const storeId = params.storeId as string;

    if (!storeId) {
        return <div className="flex items-center justify-center h-screen">ID da loja não encontrado.</div>;
    }

    return <GoalGetterDashboard storeId={storeId} />;
}

export default function DashboardPage() {
    return (
        <main>
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando Dashboard...</div>}>
                <DashboardContent />
            </Suspense>
        </main>
    );
}
"use client";

import { GoalGetterDashboard } from "@/components/goal-getter-dashboard";
import { useParams } from 'next/navigation';
import { Suspense } from "react";
import AppLayout from "@/components/app-layout";
import { Loader2 } from "lucide-react";

function DashboardContent() {
    const params = useParams();
    const storeId = params.storeId as string;

    if (!storeId) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <p className="text-muted-foreground">ID da loja não encontrado na URL.</p>
            </div>
        );
    }

    return <GoalGetterDashboard storeId={storeId} />;
}

export default function DashboardPage() {
    return (
        <AppLayout>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                    <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Carregando Dashboard...</p>
                </div>
            }>
                <DashboardContent />
            </Suspense>
        </AppLayout>
    );
}

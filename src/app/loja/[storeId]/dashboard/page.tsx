"use client";

import { GoalGetterDashboard } from "@/components/goal-getter-dashboard";
import { useParams } from 'next/navigation';
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientOnly from "@/components/client-only";

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
        <ClientOnly>
             <main className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center h-screen">
                        <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Carregando Dashboard...</p>
                    </div>
                }>
                    <DashboardContent />
                </Suspense>
            </main>
        </ClientOnly>
    );
}

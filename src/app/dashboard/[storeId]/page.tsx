
"use client";

import { GoalGetterDashboard } from "@/components/goal-getter-dashboard";
import { Suspense } from "react";
import { useParams } from 'next/navigation';

function DashboardContent() {
    const params = useParams();
    const storeId = params.storeId as string;

    if (!storeId) {
        return <div>ID da loja não encontrado.</div>;
    }

    return <GoalGetterDashboard storeId={storeId} />
}

export default function DashboardPage() {
  return (
    <main>
      <Suspense fallback={<div>Carregando...</div>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

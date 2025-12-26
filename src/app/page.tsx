"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/app-layout";
import { Logo } from "@/components/logo";
import { StoreCard } from "@/components/store-card";
import { AdminButton } from "@/components/admin-button";

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores");
        if (!res.ok) throw new Error("Falha ao carregar lojas");
        const data = await res.json();
        setStores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8 bg-[#F6F7FB] dark:bg-slate-900">
        <div className="w-full max-w-5xl text-center">
            <Logo className="justify-center mb-4 h-16" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Bem-vindo(a) ao Acelera GT
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Selecione uma loja abaixo para acessar o painel de desempenho.
            </p>
            <div className="mt-10">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : error ? (
                     <Card className="border-destructive bg-destructive/10">
                        <CardHeader>
                            <CardTitle className="text-destructive">Erro ao carregar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{error}</p>
                            <Button variant="link" onClick={() => window.location.reload()}>Tentar novamente</Button>
                        </CardContent>
                    </Card>
                ) : stores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {stores.map((store) => (
                           <StoreCard
                              key={store.id}
                              name={store.name}
                              onClick={() => router.push(`/loja/${store.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">Nenhuma loja cadastrada no momento.</p>
                )}
            </div>
            <div className="mt-12 pt-6">
                <AdminButton onClick={() => router.push('/admin')}/>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

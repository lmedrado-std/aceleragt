
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/app-layout";
import { Logo } from "@/components/logo";

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl text-center">
            <Logo className="justify-center mb-4 h-16" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Bem-vindo(a) ao Acelera GT
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
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
                        <Link href={`/loja/${store.id}`} key={store.id} className="block group">
                            <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary hover:-translate-y-1">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <StoreIcon className="h-6 w-6 text-primary" />
                                        </div>
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                            {store.name}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        Clique para acessar o painel desta loja.
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Nenhuma loja cadastrada no momento.</p>
                )}
            </div>
            <div className="mt-12 border-t pt-6">
                <Button variant="outline" asChild>
                    <Link href="/admin">
                       Acessar Painel de Administrador
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}

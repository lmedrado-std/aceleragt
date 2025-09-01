
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Store as StoreIcon, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState, Store } from "@/lib/storage";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedState = loadState();
    setState(loadedState);
    setLoading(false);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
      <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: HOME (page.tsx)</div>
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          Bem-vindo ao Corridinha GT
        </h1>
        <p className="text-xl text-muted-foreground text-center">
          Selecione a loja para visualizar o painel.
        </p>

        <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
          <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Selecione uma Loja</h2>
          {loading ? (
            <p className="text-center text-muted-foreground">Carregando lojas...</p>
          ) : !state || state.stores.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p>Nenhuma loja encontrada.</p>
              <p className="text-sm mt-2">O administrador precisa adicionar uma loja no painel global.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {state.stores.map((store) => (
                <Button asChild size="lg" variant="outline" key={store.id} className="justify-start h-auto py-3">
                  <Link href={`/loja/${store.id}`} className="flex items-center gap-4 w-full">
                    <StoreIcon className="h-6 w-6" />
                    <span className="font-semibold text-base flex-grow text-left">{store.name}</span>
                    <ArrowRight className="ml-auto h-5 w-5" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Button variant="link" asChild>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Acesso Restrito de Administrador
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}


"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Lock, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState } from "@/lib/storage";

export default function Home() {
  const [stores, setStores] = useState<AppState['stores']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = loadState();
    setStores(state.stores);
    setLoading(false);
  }, []);


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          Bem-vindo ao Corridinha GT
        </h1>
        <p className="text-xl text-muted-foreground text-center">
          Selecione a loja para continuar.
        </p>
        
        <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
            <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel da Loja</h2>
            {loading ? (
                 <p className="text-center text-muted-foreground">Carregando lojas...</p>
            ) : (
                 <div className="grid grid-cols-1 gap-4">
                    {stores.map((store) => (
                      <Button asChild size="lg" variant="outline" key={store.id} className="justify-start h-auto py-3">
                        <Link href={`/loja/${store.id}`} className="flex items-center gap-4">
                           <Store className="h-10 w-10" />
                           <div className="flex flex-col items-start">
                              <span className="font-semibold text-base">{store.name}</span>
                              <span className="text-sm text-muted-foreground font-normal">Ver painel da loja</span>
                           </div>
                           <ArrowRight className="ml-auto h-5 w-5" />
                        </Link>
                      </Button>
                    ))}
                 </div>
            )}
        </div>
         <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Acesso Restrito
            </Link>
        </div>
      </div>
    </main>
  );
}

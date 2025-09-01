
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Store as StoreIcon, Lock, Loader2, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState } from "@/lib/storage";

export default function Home() {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedState = loadState();
    setState(loadedState);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
      <div className="flex flex-col items-center gap-8 max-w-4xl w-full">
        
        <Logo className="w-20 h-20 bg-gradient-to-br from-primary to-secondary" />

        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-sm">
            Bem-vindo Corridinha GT
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Acompanhe o desempenho de suas vendas e impulsione suas metas!
          </p>
        </div>

        <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-lg border border-gray-200/80 mt-4">
          <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">
            Selecione sua loja para começar 🚀
          </h2>

          {!state || state.stores.length === 0 ? (
            <div className="flex flex-col items-center text-gray-500 py-6 text-center">
              <FolderOpen className="h-12 w-12 mb-4 text-gray-300" />
              <p className="font-medium text-lg">Nenhuma loja encontrada</p>
              <p className="text-sm mt-1 text-gray-400 max-w-xs">
                O administrador precisa adicionar uma loja no painel global para começar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {state.stores.map((store) => (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  key={store.id}
                  className="justify-start h-auto py-4 px-5 rounded-xl border-gray-200 hover:bg-slate-100 hover:border-primary transition-all shadow-sm hover:shadow-lg hover:-translate-y-1"
                >
                  <Link href={`/loja/${store.id}`} className="flex items-center gap-4 w-full">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: store.themeColor || 'hsl(var(--primary))' }}
                    >
                      <StoreIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-base flex-grow text-left text-gray-700">
                      {store.name}
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            asChild
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
          >
            <Link href="/login?redirect=/admin">
              <Lock className="h-4 w-4" />
              Acesso Restrito de Administrador
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

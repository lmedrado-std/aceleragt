
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
        <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8 relative">
      <div className="flex flex-col items-center gap-10 max-w-4xl w-full">
        <Logo />

        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold font-headline text-indigo-700 drop-shadow-sm">
            Bem-vindo ao Corridinha GT
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Selecione a loja para visualizar o painel.
          </p>
        </div>

        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-indigo-100">
          <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">
            Selecione uma Loja
          </h2>

          {!state || state.stores.length === 0 ? (
            <div className="flex flex-col items-center text-gray-500 py-6">
              <FolderOpen className="h-10 w-10 mb-3 text-gray-400" />
              <p className="font-medium">Nenhuma loja encontrada</p>
              <p className="text-sm mt-1 text-gray-400">
                O administrador precisa adicionar uma loja no painel global.
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
                  className="justify-start h-auto py-4 px-5 rounded-2xl border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
                >
                  <Link href={`/loja/${store.id}`} className="flex items-center gap-4 w-full">
                    <StoreIcon className="h-7 w-7 text-indigo-600" />
                    <span className="font-semibold text-base flex-grow text-left text-gray-700">
                      {store.name}
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 text-indigo-500" />
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
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
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

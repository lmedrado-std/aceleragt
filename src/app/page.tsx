"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Store as StoreIcon, Lock, Loader2, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { AppState, loadState } from "@/lib/storage";
import { motion } from "framer-motion";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-gray-300">Carregando...</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <motion.div 
        className="flex flex-col items-center gap-8 max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo animada */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <Logo className="w-20 h-20 drop-shadow-xl" />
        </motion.div>

        {/* Título */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 drop-shadow-lg">
            Corridinha GT 🚀
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Acompanhe o desempenho da sua loja e impulsione suas metas!
          </p>
        </div>

        {/* Card principal */}
        <motion.div
          className="w-full max-w-lg backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl border border-white/20 mt-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-center text-xl font-semibold text-gray-100 mb-6">
            Selecione sua loja para começar
          </h2>

          {!state || state.stores.length === 0 ? (
            <div className="flex flex-col items-center text-gray-400 py-6 text-center">
              <FolderOpen className="h-12 w-12 mb-4 text-gray-500" />
              <p className="font-medium text-lg">Nenhuma loja encontrada</p>
              <p className="text-sm mt-1 text-gray-500 max-w-xs">
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
                  className="justify-start h-auto py-4 px-5 rounded-xl border-gray-700/40 bg-slate-800/40 
                            hover:bg-slate-700 hover:border-indigo-400 transition-all 
                            shadow-sm hover:shadow-indigo-500/20 hover:-translate-y-1 group"
                >
                  <Link href={`/loja/${store.id}`} className="flex items-center gap-4 w-full">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                      style={{ backgroundColor: store.themeColor || 'hsl(var(--primary))' }}
                    >
                      <StoreIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-base flex-grow text-left text-gray-200">
                      {store.name}
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Link Admin */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            asChild
            className="text-sm text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
          >
            <Link href="/login?redirect=/admin">
              <Lock className="h-4 w-4" />
              Acesso Restrito de Administrador
            </Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
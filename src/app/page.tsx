
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { Store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Moon, Sun, Shield, Search, X } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Logo } from "@/components/logo";
import { StoreCard } from "@/components/store-card";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const storeCardColors = [
    "border-blue-500",
    "border-green-500",
    "border-purple-500",
    "border-orange-500",
    "border-pink-500",
    "border-yellow-500",
    "border-teal-500",
    "border-cyan-500",
    "border-red-500",
    "border-indigo-500",
];


function AppFooter() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const renderThemeToggle = () => {
        if (!mounted) {
            return <div className="h-10 w-10" />;
        }
        return (
            <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-slate-200">
                {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
        )
    }

    return (
        <footer className="mt-auto pt-12 pb-8 text-center border-t border-border/40">
            <div className="flex flex-col items-center gap-4">
                {renderThemeToggle()}
                <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        V 2.0.1 BUILD ESTÁVEL
                    </p>
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} Acelera GT • <span className="opacity-70">RyannBreston dev</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}


export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchText] = useState("");
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

  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 min-h-screen">
        <div className="w-full max-w-5xl flex flex-col flex-1">
            
            <Card className="mb-8 bg-primary shadow-2xl border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Logo className="h-12" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                        Acelera GT
                    </h1>
                    <p className="text-white/80 text-sm md:text-base font-medium">
                        Selecione uma loja para gerenciar o desempenho.
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="lg" className="shadow-lg hover:scale-105 transition-transform font-bold" onClick={() => router.push('/admin')}>
                  <Shield className="mr-2 h-5 w-5" /> Painel Global
                </Button>
              </CardContent>
            </Card>

            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar loja pelo nome..." 
                        className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50 focus:ring-primary text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchText("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="text-sm font-bold text-muted-foreground whitespace-nowrap bg-white/30 dark:bg-slate-800/30 px-4 py-2 rounded-full backdrop-blur-sm border border-border/20">
                    {filteredStores.length} {filteredStores.length === 1 ? 'Loja' : 'Lojas'}
                </div>
            </div>

            <div className="mt-4 flex-1">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground font-semibold animate-pulse">Carregando indicadores das lojas...</p>
                    </div>
                ) : error ? (
                     <Card className="border-destructive bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <X className="h-5 w-5" /> Erro de Conexão
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
                        </CardContent>
                    </Card>
                ) : filteredStores.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStores.map((store, index) => (
                           <StoreCard
                              key={store.id}
                              name={store.name}
                              onClick={() => router.push(`/loja/${store.id}`)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border/50 rounded-3xl">
                        <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-xl font-bold text-muted-foreground">Nenhuma loja encontrada</p>
                        <p className="text-sm text-muted-foreground/70">Tente buscar com outro termo.</p>
                        <Button variant="link" onClick={() => setSearchText("")} className="mt-2">Limpar busca</Button>
                    </div>
                )}
            </div>
            
            <AppFooter />
        </div>
      </div>
    </AppLayout>
  );
}

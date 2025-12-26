"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { Store } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Moon, Sun } from "lucide-react";
import AppLayout from "@/components/app-layout";
import { Logo } from "@/components/logo";
import { StoreCard } from "@/components/store-card";
import { AdminButton } from "@/components/admin-button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

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
        <footer className="mt-auto pt-16 pb-8 text-center text-slate-400">
            {renderThemeToggle()}
            <div className="mt-4 space-y-1 text-sm">
                <p>v1.0.1 - Build Estável</p>
                <p>RyannBreston desenvolvedor</p>
                <p>© {new Date().getFullYear()} Acelera GT.</p>
            </div>
        </footer>
    );
}


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
      <div className="flex flex-1 flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
        <div className="w-full max-w-5xl text-center flex flex-col min-h-full">
            
            <Card className="mb-8 bg-accent/80 backdrop-blur-sm border-border/20 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-start gap-4">
                <Logo className="h-12" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white text-left">
                      Bem-vindo(a) ao Acelera GT
                  </h1>
                  <p className="text-sm text-white/80 text-left">
                      Selecione uma loja abaixo para acessar o painel de desempenho.
                  </p>
                </div>
              </CardContent>
            </Card>

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
                        {stores.map((store, index) => (
                           <StoreCard
                              key={store.id}
                              name={store.name}
                              onClick={() => router.push(`/loja/${store.id}`)}
                              className={storeCardColors[index % storeCardColors.length]}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">Nenhuma loja cadastrada no momento.</p>
                )}
            </div>
            <div className="mt-12 pt-6">
                <AdminButton onClick={() => router.push('/admin')}/>
            </div>
            <AppFooter />
        </div>
      </div>
    </AppLayout>
  );
}

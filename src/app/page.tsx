
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Store as StoreIcon, Building, LayoutDashboard, Moon, Sun, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/stores");
        if (!res.ok) {
          console.error("Falha ao buscar lojas");
          return;
        }
        const data = await res.json();
        setStores(data);
      } catch (error) {
        console.error("Erro de rede ao buscar lojas:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
    
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if(isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if(newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };


  const SidebarLink = ({ href, icon: Icon, children }: { href: string, icon: React.ElementType, children: React.ReactNode}) => (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ scale: 1.05, x: 5 }}
        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
      >
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </motion.div>
    </Link>
  )

  return (
    <div className="w-full max-w-6xl mx-auto md:h-[80vh] md:min-h-[600px] flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-card">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-primary to-destructive text-primary-foreground p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8 md:mb-12">
          <div className="bg-white/20 p-2 rounded-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Acelera GT</h1>
        </div>
        <nav className="space-y-3">
          <SidebarLink href="/admin" icon={Building}>
            Admin
          </SidebarLink>
           {stores.length > 0 && (
             <div className="pt-4 mt-4 border-t border-white/20">
                 <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase">Lojas</h2>
                  {stores.map((store) => (
                    <SidebarLink key={store.id} href={`/loja/${encodeURIComponent(store.id)}`} icon={LayoutDashboard}>
                      {store.name}
                    </SidebarLink>
                  ))}
             </div>
           )}
        </nav>
        <div className="mt-auto">
           <motion.button
            onClick={toggleDarkMode}
            whileHover={{ scale: 1.05, x: 5 }}
            className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </motion.button>
          <div className="text-center text-xs text-white/50 space-y-1 mt-6">
            <p>Build Teste 0.0.1 Version</p>
            <p>RyannBreston desenvolvedor</p>
            <p>© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 sm:p-16 bg-background">
        <Card className="shadow-2xl rounded-2xl w-full">
            <CardContent className="flex flex-col items-center justify-center p-10 sm:p-16">
                 <div className="flex flex-col items-center text-center gap-4">
                    <Rocket className="h-16 w-16 sm:h-20 sm:w-20 text-primary animate-pulse" />
                    <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">
                        Bem-vindo(a) ao <br/> <span className="text-destructive">Acelera GT</span>
                    </h1>
                </div>

                {loading ? (
                    <div className="mt-8 text-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin inline" />
                        <p className="inline">Carregando lojas...</p>
                    </div>
                ) : stores.length === 0 && (
                  <div className="mt-8 text-center">
                    <CardDescription>Parece que nenhuma loja foi criada ainda.</CardDescription>
                    <Button asChild className="mt-4">
                        <Link href="/admin">
                            <Building className="mr-2 h-4 w-4" />
                            Ir para o Admin e criar uma loja
                        </Link>
                    </Button>
                  </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}


"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadStateFromStorage, Store } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Store as StoreIcon, Building, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const state = loadStateFromStorage();
    setStores(state.stores || []);
  }, []);

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
    <div className="w-full max-w-6xl mx-auto h-[80vh] min-h-[600px] flex rounded-2xl shadow-2xl overflow-hidden bg-card">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-primary to-destructive text-primary-foreground p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
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
        <div className="mt-auto text-center text-xs text-white/50 space-y-1">
          <p>Build Teste 0.0.1 Version</p>
          <p>RyannBreston desenvolvedor</p>
          <p>© {new Date().getFullYear()} Acelera GT. Todos os direitos reservados.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 sm:p-16 bg-background">
          <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
              <div className="flex items-center gap-4">
                  <Rocket className="h-16 w-16 text-primary animate-pulse" />
                  <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary text-center">
                      Bem-vindo(a) ao <br/> <span className="text-destructive">Acelera GT</span>
                  </h1>
              </div>
              <p className="text-lg text-muted-foreground text-center max-w-2xl">
                  Selecione uma loja na barra lateral para começar ou acesse o painel de Admin.
              </p>

              {stores.length > 0 ? (
                 <Card className="mt-8 w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><StoreIcon className="text-primary"/> Acessar Loja</CardTitle>
                        <CardDescription>Selecione uma loja abaixo para ver o painel de metas.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stores.map((store) => (
                        <Button asChild key={store.id} variant="outline">
                            <Link href={`/loja/${encodeURIComponent(store.id)}`}>{store.name}</Link>
                        </Button>
                        ))}
                    </CardContent>
                </Card>
              ) : (
                  <Card className="mt-8 text-center">
                      <CardHeader>
                          <CardTitle>Nenhuma loja encontrada!</CardTitle>
                          <CardDescription>Parece que nenhuma loja foi criada ainda.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <Button asChild>
                              <Link href="/admin">
                                  <Building className="mr-2 h-4 w-4" />
                                  Ir para o Admin e criar uma loja
                              </Link>
                          </Button>
                      </CardContent>
                  </Card>
              )}
          </div>
      </main>
    </div>
  );
}

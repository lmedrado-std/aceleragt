
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadStateFromStorage, Store } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Store as StoreIcon, Building, LogIn } from 'lucide-react';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const state = loadStateFromStorage();
    setStores(state.stores || []);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
            <div className="flex items-center gap-4">
                <Rocket className="h-12 w-12 text-primary" />
                <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary">
                    Acelera GT
                </h1>
            </div>
            <p className="text-lg text-muted-foreground text-center max-w-2xl">
                Selecione uma loja para ver o dashboard de vendas e incentivos dos vendedores.
            </p>

            {stores.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-6">
                    {stores.map((store) => (
                        <Card key={store.id} className="hover:shadow-lg transition-shadow">
                             <CardHeader className="flex-row items-center gap-4 space-y-0">
                                <div className="p-3 bg-muted rounded-lg">
                                    <StoreIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>{store.name}</CardTitle>
                                    <CardDescription>ID: {store.id}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/loja/${encodeURIComponent(store.id)}`} passHref>
                                    <Button className="w-full">Acessar Dashboard</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card className="w-full max-w-md mt-6">
                    <CardHeader>
                        <CardTitle className="text-center">Nenhuma loja encontrada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground mb-4">
                            Parece que não há lojas cadastradas no momento. Comece adicionando uma loja no painel de administração.
                        </p>
                         <Link href="/admin" passHref>
                             <Button className="w-full">
                                <Building className="mr-2 h-4 w-4" />
                                Ir para Admin
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
            
             <div className="absolute top-4 right-4">
                <Button asChild variant="outline">
                    <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Acesso Admin
                    </Link>
                </Button>
            </div>

        </div>
    </main>
  );
}


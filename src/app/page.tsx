"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadStateFromStorage, Store } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Store as StoreIcon, Building } from 'lucide-react';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const state = loadStateFromStorage();
    const existingStores = state.stores || [];
    const supermodaStore: Store = { id: 'supermoda', name: 'Supermoda' };

    // Garante que a loja Supermoda esteja sempre presente e no topo, sem duplicatas
    const otherStores = existingStores.filter(store => store.id !== supermodaStore.id);
    setStores([supermodaStore, ...otherStores]);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8 relative">
        <div className="absolute top-4 left-4">
            <Button asChild variant="outline">
                <Link href="/admin">
                    <Building className="mr-2 h-4 w-4" />
                    Painel Global
                </Link>
            </Button>
        </div>

        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mt-16 sm:mt-0">
            <div className="flex items-center gap-4">
                <Rocket className="h-12 w-12 text-primary" />
                <h1 className="text-4xl sm:text-5xl font-bold font-headline text-primary text-center">
                    Bem-vindo(a) ao Acelera GT
                </h1>
            </div>
            <p className="text-lg text-muted-foreground text-center max-w-2xl">
                Selecione uma loja para acessar o painel administrativo.
            </p>

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
                            <Link href={`/admin/loja/${encodeURIComponent(store.id)}`} passHref>
                                <Button className="w-full">Acessar Painel</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </main>
  );
}


"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Store } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight, Shield } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        setStores(data);
      } catch (error) {
        console.error("Failed to fetch stores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Logo className="mb-4" />
          <CardTitle className="text-2xl font-bold">Bem-vindo ao Acelera GT</CardTitle>
          <CardDescription>Selecione uma loja para começar</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {stores.map((store) => (
                <Button key={store.id} asChild variant="outline" className="justify-between">
                  <Link href={`/loja/${store.id}`}>
                    {store.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Painel do Administrador
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

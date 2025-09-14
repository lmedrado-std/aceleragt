
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building, ChevronRight, Store as StoreIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/logo';

interface Store {
  id: number;
  name: string;
}

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchStores() {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) {
          throw new Error('Falha ao buscar lojas');
        }
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-md flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="h-32 w-auto" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-lg text-muted-foreground"
        >
          Selecione uma loja para continuar ou acesse o painel de administrador.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 w-full space-y-3"
        >
          {loading ? (
            <p>Carregando lojas...</p>
          ) : (
            stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <Button
                  variant="secondary"
                  className="w-full justify-between h-14 text-lg bg-secondary/10 hover:bg-secondary/20"
                  onClick={() => router.push(`/loja/${store.id}`)}
                >
                  <div className="flex items-center">
                    <StoreIcon className="mr-3 h-5 w-5" />
                    {store.name}
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </motion.div>
            ))
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 w-full"
        >
          <Button
            variant="outline"
            className="w-full h-12 border-primary/50 text-primary hover:bg-primary/10"
            asChild
          >
            <Link href="/admin">
              <Building className="mr-2 h-5 w-5" />
              Painel do Administrador
            </Link>
          </Button>
        </motion.div>
      </div>
    </main>
  );
}

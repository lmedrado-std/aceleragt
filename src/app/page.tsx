
'use client';

import { Rocket, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-card rounded-lg shadow-lg p-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="flex justify-center">
            <Rocket className="h-20 w-20 text-primary" />
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Bem-vindo(a) ao <span className="text-primary">Acelera GT</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Selecione uma loja para começar ou acesse o painel administrativo.
        </p>
         <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
                <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Painel do Administrador
                </Link>
            </Button>
        </div>
      </motion.div>
    </div>
  );
}

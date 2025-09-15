
'use client';

import { Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-card rounded-lg shadow-lg p-8">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center"
      >
        <div className="flex justify-center">
            <Rocket className="h-20 w-20 text-primary" />
        </div>
        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Bem-vindo(a) ao <span className="text-primary">Acelera GT</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Selecione uma loja ou acesse o painel de administrador na barra lateral para começar.
        </p>
      </motion.div>
    </div>
  );
}

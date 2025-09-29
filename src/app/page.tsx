"use client";

import AppLayout from '@/components/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

export default function HomePage() {

  return (
    <AppLayout>
      <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-lg md:max-w-2xl shadow-lg">
              <CardContent className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                  <Rocket className="h-20 w-20 text-primary mb-6" />
                  <h1 className="text-3xl md:text-4xl font-bold">
                      <span className="text-destructive">Bem-vindo(a) ao </span> 
                      <span className="text-primary">Acelera GT</span>
                  </h1>
                  <p className="text-muted-foreground mt-3 text-sm md:text-base">
                      Selecione uma loja na barra lateral para começar.
                  </p>
              </CardContent>
          </Card>
      </div>
    </AppLayout>
  );
}

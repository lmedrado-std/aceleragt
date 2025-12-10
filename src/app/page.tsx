
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
                  <Rocket className="h-24 w-24 text-primary mb-6" />
                  <h1 className="text-4xl md:text-5xl font-bold">
                      Bem-vindo(a) ao Acelera GT
                  </h1>
                  <p className="text-muted-foreground mt-4 text-lg md:text-xl">
                      Selecione uma loja na barra lateral para começar.
                  </p>
              </CardContent>
          </Card>
      </div>
    </AppLayout>
  );
}

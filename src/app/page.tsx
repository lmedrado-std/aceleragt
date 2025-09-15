
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

export default function HomePage() {

  return (
    <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-lg shadow-lg">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <Rocket className="h-16 w-16 text-primary mb-6" />
                <h1 className="text-3xl font-bold text-foreground">
                    Bem-vindo(a) ao <span className="text-primary">Acelera GT</span>
                </h1>
                <p className="text-muted-foreground mt-2">
                    Selecione uma loja na barra lateral para começar ou acesse o painel de Admin para configurar.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}

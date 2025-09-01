
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, User, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


type Seller = {
  id: string;
  name: string;
};

export default function Home() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem("goalGetterState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState && Array.isArray(parsedState.sellers)) {
          setSellers(parsedState.sellers);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      // Fallback or handle error if needed
    } finally {
        setLoading(false);
    }
  }, []);


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          Bem-vindo ao Corridinha GT
        </h1>
        <p className="text-xl text-muted-foreground text-center">
          Selecione seu usuário para começar.
        </p>
        
        <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
            <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel</h2>
            {loading ? (
                 <p className="text-center text-muted-foreground">Carregando vendedores...</p>
            ) : (
                 <div className="grid grid-cols-1 gap-4">
                     <Button asChild size="lg" variant="secondary" className="justify-start h-auto py-3">
                      <Link href="/dashboard?tab=admin" className="flex items-center gap-4">
                        <Shield className="h-6 w-6" />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-base">Administrador</span>
                          <span className="text-sm text-muted-foreground font-normal">Ver painel de controle</span>
                        </div>
                        <ArrowRight className="ml-auto h-5 w-5" />
                      </Link>
                    </Button>
                    {sellers.map((seller) => (
                      <Button asChild size="lg" variant="outline" key={seller.id} className="justify-start h-auto py-3">
                        <Link href={`/dashboard?tab=${seller.id}`} className="flex items-center gap-4">
                           <Avatar>
                             <AvatarFallback>{seller.name.charAt(0).toUpperCase()}</AvatarFallback>
                           </Avatar>
                           <div className="flex flex-col items-start">
                              <span className="font-semibold text-base">{seller.name}</span>
                              <span className="text-sm text-muted-foreground font-normal">Ver meu desempenho</span>
                           </div>
                           <ArrowRight className="ml-auto h-5 w-5" />
                        </Link>
                      </Button>
                    ))}
                 </div>
            )}
        </div>
      </div>
    </main>
  );
}

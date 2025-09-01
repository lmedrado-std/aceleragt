
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Home, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { loadState, Seller } from "@/lib/storage";

export default function StoreHomePage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const params = useParams();
  const router = useRouter();
  const storeId = params.storeId as string;

  useEffect(() => {
    if (!storeId) return;

    let attempts = 0;
    const maxAttempts = 5;
    const intervalId = setInterval(() => {
        try {
            const savedState = loadState();
            const store = savedState.stores.find(s => s.id === storeId);
            
            if (store) {
                clearInterval(intervalId); // Stop trying
                setStoreName(store.name);
                setSellers(savedState.sellers[storeId] || []);
                setLoading(false);
            } else {
                attempts++;
                if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.error("Store not found after multiple attempts, redirecting.");
                    router.push('/');
                }
            }
        } catch (error) {
            clearInterval(intervalId);
            console.error("Failed to load state from localStorage", error);
            router.push('/');
        }
    }, 200); // Check every 200ms

    return () => clearInterval(intervalId); // Cleanup on unmount

  }, [storeId, router]);

  const handleAdminAccess = () => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (isAdmin) {
      router.push(`/dashboard/${storeId}?tab=admin`);
    } else {
      // Redirect to login, but pass the destination so we can come back
      const destination = `/dashboard/${storeId}?tab=admin`;
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
    }
  };


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
       <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: LOJA (loja/[storeId]/page.tsx)</div>
       <div className="absolute top-4 left-4">
            <Button asChild variant="outline">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Todas as Lojas
                </Link>
            </Button>
        </div>
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          {loading ? "Carregando..." : storeName}
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
                     <Button size="lg" variant="secondary" className="justify-start h-auto py-3" onClick={handleAdminAccess}>
                      <div className="flex items-center gap-4 w-full">
                        <Shield className="h-6 w-6" />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-base">Administrador</span>
                          <span className="text-sm text-muted-foreground font-normal">Ver painel de controle</span>
                        </div>
                        <ArrowRight className="ml-auto h-5 w-5" />
                      </div>
                    </Button>
                    {sellers.map((seller) => (
                      <Button asChild size="lg" variant="outline" key={seller.id} className="justify-start h-auto py-3">
                        <Link href={`/dashboard/${storeId}?tab=${seller.id}`} className="flex items-center gap-4">
                           <SellerAvatar avatarId={seller.avatarId} className="h-10 w-10" />
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

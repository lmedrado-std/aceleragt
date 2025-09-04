
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { loadState, Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

export default function StoreHomePage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const storeId = params.storeId as string;

  const loadStoreData = useCallback(() => {
    if (!storeId) {
      setError("ID da loja não encontrado na URL.");
      setLoading(false);
      return;
    };

    try {
        const decodedStoreId = decodeURIComponent(storeId);
        const savedState = loadState();
        const foundStore = savedState.stores.find(s => s.id === decodedStoreId);
        
        if (foundStore) {
            setStore(foundStore);
            setSellers(savedState.sellers[decodedStoreId] || []);
            setError(null); // Clear previous errors if found
        } else {
            setError(`Loja com ID "${decodedStoreId}" não foi encontrada.`);
            toast({
              variant: "destructive",
              title: "Erro ao carregar",
              description: `A loja que você está tentando acessar não foi encontrada.`,
            });
        }
    } catch (e) {
        console.error("Failed to load state from localStorage", e);
        setError("Ocorreu um erro ao carregar os dados da loja.");
    } finally {
        setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  useEffect(() => {
    if (store?.themeColor) {
      document.documentElement.style.setProperty('--primary', store.themeColor);
    }
    // Cleanup on component unmount is not strictly necessary here
    // as other pages will set their own theme.
  }, [store]);


  const handleAdminAccess = () => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    const destination = `/dashboard/${storeId}?tab=admin`;
    if (isAdmin) {
      router.push(destination);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
    }
  };

  const handleSellerAccess = (sellerId: string) => {
    const isSellerAuthenticated = sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';
    const destination = `/dashboard/${storeId}?tab=${sellerId}`;

    if (isSellerAuthenticated) {
      router.push(destination);
    } else {
      router.push(`/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(destination)}`);
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando dados da loja...</p>
        </div>
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
       <div className="absolute top-4 left-4">
            <Button asChild variant="outline">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Todas as Lojas
                </Link>
            </Button>
        </div>
      <div className="flex flex-col items-center gap-6 max-w-4xl w-full">
        <h1 className="text-5xl font-extrabold text-primary tracking-wide text-center">
          {error ? "Erro" : store?.name}
        </h1>

        {error && (
            <p className="text-xl text-destructive text-center">{error}</p>
        )}
        
        {!loading && !error && (
            <>
                <p className="text-xl text-muted-foreground text-center">
                Selecione seu usuário para começar.
                </p>
                <Card className="w-full max-w-md bg-card p-6 rounded-2xl shadow-lg mt-8 border">
                    <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel</h2>
                    <div className="grid grid-cols-1 gap-4">
                        <Button size="lg" variant="secondary" className="justify-start h-auto py-3 rounded-lg font-semibold transition-transform transform hover:scale-105" onClick={handleAdminAccess}>
                        <div className="flex items-center gap-4 w-full">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10"><Shield className="h-6 w-6 text-primary" /></div>
                            <div className="flex flex-col items-start">
                            <span className="font-semibold text-base text-foreground">Administrador</span>
                            <span className="text-sm text-muted-foreground font-normal">Ver painel de controle</span>
                            </div>
                            <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                        </div>
                        </Button>
                        {sellers.map((seller) => (
                        <Button 
                            size="lg" 
                            variant="outline" 
                            key={seller.id} 
                            className="justify-start h-auto py-3 rounded-lg transition-transform transform hover:scale-105 hover:bg-accent hover:text-accent-foreground"
                            onClick={() => handleSellerAccess(seller.id)}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <SellerAvatar avatarId={seller.avatarId} className="h-10 w-10" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-base text-foreground">{seller.name}</span>
                                    <span className="text-sm text-muted-foreground font-normal">Ver meu desempenho</span>
                                </div>
                                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                            </div>
                        </Button>
                        ))}
                    </div>
                </Card>
            </>
        )}
      </div>
    </main>
  );
}

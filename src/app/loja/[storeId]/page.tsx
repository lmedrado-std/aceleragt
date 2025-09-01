
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ArrowRight, Home, Shield, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { loadState, Seller } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function StoreHomePage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [storeName, setStoreName] = useState('');
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
        const store = savedState.stores.find(s => s.id === decodedStoreId);
        
        if (store) {
            setStoreName(store.name);
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

    // Listen for custom storage events
    const handleStorageUpdate = () => {
      console.log('Storage updated, reloading store data...');
      loadStoreData();
    };

    window.addEventListener('storage_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage_updated', handleStorageUpdate);
    };
  }, [loadStoreData]);

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
        <div className="flex flex-col items-center justify-center min-h-screen">
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
        <Logo />
        <h1 className="text-5xl font-bold font-headline text-primary text-center">
          {error ? "Erro" : storeName}
        </h1>

        {error && (
            <p className="text-xl text-destructive text-center">{error}</p>
        )}
        
        {!loading && !error && (
            <>
                <p className="text-xl text-muted-foreground text-center">
                Selecione seu usuário para começar.
                </p>
                <div className="w-full max-w-md border bg-card p-6 rounded-lg shadow-sm mt-8">
                    <h2 className="text-center text-lg font-semibold text-card-foreground mb-6">Acessar Painel</h2>
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
                        <Button 
                            size="lg" 
                            variant="outline" 
                            key={seller.id} 
                            className="justify-start h-auto py-3"
                            onClick={() => handleSellerAccess(seller.id)}
                        >
                            <div className="flex items-center gap-4 w-full">
                                <SellerAvatar avatarId={seller.avatarId} className="h-10 w-10" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-base">{seller.name}</span>
                                    <span className="text-sm text-muted-foreground font-normal">Ver meu desempenho</span>
                                </div>
                                <ArrowRight className="ml-auto h-5 w-5" />
                            </div>
                        </Button>
                        ))}
                    </div>
                </div>
            </>
        )}
      </div>
    </main>
  );
}

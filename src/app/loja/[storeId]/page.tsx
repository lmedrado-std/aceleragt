"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield, Loader2, User } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { loadState, Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

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
            setError(null);
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
  
  if (error) {
     return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
             <h1 className="text-3xl font-bold text-destructive mb-4">Erro ao Carregar Loja</h1>
             <p className="text-xl text-destructive text-center mb-8">{error}</p>
             <Button asChild variant="secondary">
                <Link href="/">
                <Home className="h-5 w-5 mr-2" />
                Voltar para Todas as Lojas
                </Link>
            </Button>
        </main>
     )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex justify-between items-center mb-8">
         <h1 
          className="text-3xl font-bold"
          style={{ color: store ? `hsl(${store.themeColor})` : 'hsl(var(--primary))' }}
        >
          {store?.name}
        </h1>
        <Button asChild variant="secondary" className="flex items-center gap-2">
            <Link href="/">
              <Home className="h-5 w-5" />
              Todas as Lojas
            </Link>
        </Button>
      </div>

      <p className="text-gray-600 text-center mb-6 text-lg">
        Selecione seu usuário para começar.
      </p>

      <Card className="w-full max-w-md shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-700">Acessar Painel</h2>

            <motion.div
                whileHover={{ scale: 1.03 }}
                onClick={handleAdminAccess}
                style={{ backgroundColor: store ? `hsl(${store.themeColor})` : 'hsl(var(--primary))' }}
                className="text-white flex items-center justify-between px-4 py-4 rounded-xl shadow cursor-pointer transition"
            >
                <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6" />
                    <div>
                        <p className="text-lg font-semibold">Administrador</p>
                        <p className="text-sm opacity-80">Ver painel de controle</p>
                    </div>
                </div>
                <ArrowRight className="h-5 w-5" />
            </motion.div>


          <div className="space-y-3">
            {sellers.map((seller) => (
                <motion.div
                    key={seller.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleSellerAccess(seller.id)}
                    className="flex items-center justify-between p-4 rounded-xl shadow-sm border hover:shadow-lg transition cursor-pointer bg-white"
                >
                    <div className="flex items-center gap-3">
                       <SellerAvatar avatarId={seller.avatarId} className="h-11 w-11" />
                        <div>
                            <p className="text-base font-semibold text-gray-800">{seller.name}</p>
                            <p className="text-sm text-gray-500">Ver meu desempenho</p>
                        </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

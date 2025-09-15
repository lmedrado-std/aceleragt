
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Home } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientOnly from "@/components/client-only";
import Link from "next/link";

function StorePageContent() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const storeId = params.storeId as string;

  const loadStoreData = useCallback(async () => {
    if (!storeId) {
      setError("ID da loja não encontrado na URL.");
      setLoading(false);
      return;
    };

    try {
        const [storeRes, sellersRes] = await Promise.all([
          fetch(`/api/stores/${storeId}`),
          fetch(`/api/sellers?storeId=${storeId}`),
        ]);

        if (!storeRes.ok) throw new Error('Loja não encontrada');
        const storeData = await storeRes.json();
        setStore(storeData);

        if (!sellersRes.ok) throw new Error('Falha ao carregar vendedores');
        const sellersData = await sellersRes.json();
        setSellers(sellersData);
        
        setError(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro ao carregar os dados da loja.";
        console.error("Failed to load store data", e);
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Erro ao carregar",
          description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

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
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-card rounded-lg">
            <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando dados da loja...</p>
        </div>
    )
  }
  
  if (error) {
     return (
        <div className="bg-card rounded-lg flex flex-col items-center justify-center p-8">
             <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao Carregar Loja</h1>
             <p className="text-center text-destructive/80 mb-8">{error}</p>
        </div>
     )
  }

  return (
    <Card className="min-h-full shadow-lg flex flex-col p-6 sm:p-8 w-full max-w-2xl mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {store?.name || "Carregando..."}
            </h1>
            <p className="text-muted-foreground">
              Selecione seu usuário para ver seu desempenho e metas.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Início
            </Link>
          </Button>
        </header>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-3">
              {(sellers || []).map((seller) => (
                <motion.div
                  key={seller.id}
                  onClick={() => handleSellerAccess(seller.id)}
                  whileHover={{ scale: 1.02, x: 4, backgroundColor: 'hsl(var(--muted))' }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                      <SellerAvatar avatarId={seller.avatar_id} className="h-12 w-12" />
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {seller.name}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              ))}
               {sellers.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground pt-10">
                    Nenhum vendedor cadastrado nesta loja ainda.
                  </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
    </Card>
  );
}

export default function StoreHomePage() {
  return (
    <ClientOnly>
      <StorePageContent />
    </ClientOnly>
  )
}

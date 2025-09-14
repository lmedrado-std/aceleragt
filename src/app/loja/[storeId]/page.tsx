
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Shield, Loader2, ArrowRight, Sun, Moon } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import ClientOnly from "@/components/client-only";


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
        <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
             <h1 className="text-3xl font-bold text-destructive mb-4">Erro ao Carregar Loja</h1>
             <p className="text-xl text-destructive text-center mb-8">{error}</p>
             <Button asChild variant="secondary">
                <Link href="/">
                <Home className="h-5 w-5 mr-2" />
                Voltar para Página Inicial
                </Link>
            </Button>
        </main>
     )
  }

  return (
    <div className="bg-background min-h-screen flex flex-col items-center p-4 sm:p-8 transition-colors duration-300 w-full">
      <div className="w-full max-w-4xl bg-gradient-to-r from-primary to-destructive text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-headline">
            {store?.name || "Carregando..."}
          </h1>

          <div className="flex items-center gap-3">
            <Button asChild variant="secondary" className="hidden sm:flex items-center gap-2 shadow">
              <Link href="/">
                  <Home className="h-5 w-5" />
                  Página Inicial
              </Link>
            </Button>
          </div>
        </header>
      </div>


      <p className="text-muted-foreground text-center mb-6 text-lg max-w-2xl">
        Selecione seu usuário para começar. Se você for o administrador, acesse o painel de controle.
      </p>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div whileHover={{ y: -5 }} onClick={handleAdminAccess} className="cursor-pointer">
          <Card className="h-full shadow-lg rounded-xl bg-primary text-primary-foreground flex flex-col justify-center">
            <CardHeader className="flex-row items-center gap-4">
              <Shield className="h-10 w-10" />
              <div>
                <CardTitle className="text-2xl">Administrador</CardTitle>
                <CardDescription className="text-primary-foreground/80">Painel de controle da loja</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
                <Button variant="secondary" className="w-full">
                    Acessar Painel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="shadow-lg rounded-xl flex flex-col">
          <CardHeader>
            <CardTitle className="text-primary">Vendedores</CardTitle>
            <CardDescription>Selecione seu usuário para ver seu desempenho</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 -mr-4">
              <div className="space-y-3">
                {(sellers || []).map((seller) => (
                  <motion.div
                    key={seller.id}
                    onClick={() => handleSellerAccess(seller.id)}
                    whileHover={{ scale: 1.03, x: 4 }}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                        <SellerAvatar avatarId={seller.avatar_id} className="h-11 w-11" />
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
                    <p className="text-center text-sm text-muted-foreground pt-4">
                      Nenhum vendedor cadastrado nesta loja ainda.
                    </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <Button asChild variant="link" className="mt-8 sm:hidden">
          <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Página Inicial
          </Link>
      </Button>
    </div>
  );
}

export default function StoreHomePage() {
  return (
    <ClientOnly>
      <StorePageContent />
    </ClientOnly>
  )
}

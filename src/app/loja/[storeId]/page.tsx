
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Home, Shield, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const loadStoreData = useCallback(async (showToast = false) => {
    if (!storeId) {
      setError("ID da loja não encontrado na URL.");
      setLoading(false);
      return;
    };

    setLoading(true);
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
        if (showToast) {
            toast({ title: "Dados atualizados", description: "As informações da loja foram recarregadas." });
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro ao carregar os dados da loja.";
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
    const destination = `/dashboard/${storeId}?tab=${sellerId}`;
    router.push(`/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(destination)}`);
  };

  const handleAdminAccess = () => {
    const destination = `/dashboard/${storeId}?tab=admin`;
    router.push(`/login?redirect=${encodeURIComponent(destination)}`);
  };

  const formattedLastUpdated = store?.last_incentive_calculation
    ? new Date(store.last_incentive_calculation).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (error) {
     return (
        <div className="bg-card rounded-lg flex flex-col items-center justify-center p-8 text-center h-full">
             <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao Carregar Loja</h1>
             <p className="text-destructive/80 mb-6">{error}</p>
             <Button asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar para o Início
                </Link>
             </Button>
        </div>
     )
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-6 rounded-lg bg-card shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold">{loading ? "Carregando..." : store?.name}</h1>
                    <p className="text-muted-foreground mt-1">Selecione seu usuário para começar. Se você for o administrador, acesse o painel de controle.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => loadStoreData(true)} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button variant="default" asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Página Inicial
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
        
        {/* Last Updated Banner */}
        {formattedLastUpdated && (
            <div className="mb-6 p-3 rounded-md bg-destructive text-destructive-foreground text-center flex items-center justify-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                <span>Última atualização de dados: {formattedLastUpdated}</span>
            </div>
        )}
        
        {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Admin Panel */}
                <div className="flex">
                    <Card className="w-full bg-primary text-primary-foreground flex flex-col justify-center items-center p-8 text-center">
                        <Shield className="h-16 w-16 mb-4" />
                        <CardHeader className="p-0 items-center">
                            <CardTitle className="text-2xl">Administrador</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-2">
                            <p className="text-primary-foreground/80">Painel de controle da loja</p>
                        </CardContent>
                        <Button variant="secondary" onClick={handleAdminAccess} className="mt-6 w-full max-w-xs">
                            Acessar Painel <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Card>
                </div>

                {/* Sellers List */}
                <div>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Vendedores</CardTitle>
                             <p className="text-sm text-muted-foreground">Selecione seu usuário para ver seu desempenho.</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sellers.length > 0 ? sellers.map((seller) => (
                                <button
                                    key={seller.id}
                                    onClick={() => handleSellerAccess(seller.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <SellerAvatar avatarId={seller.avatar_id} className="h-10 w-10" />
                                        <span className="font-medium text-foreground">{seller.name}</span>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                            )) : (
                                <p className="text-center text-sm text-muted-foreground pt-4">
                                    Nenhum vendedor cadastrado nesta loja ainda.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
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

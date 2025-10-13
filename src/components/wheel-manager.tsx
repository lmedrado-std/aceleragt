'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Users, TrendingUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


interface WheelManagerProps {
  storeId: string;
}

interface Seller {
  id: string;
  name: string;
  credits?: number;
}

export function WheelManager({ storeId }: WheelManagerProps) {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [creditsMap, setCreditsMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ totalSpins: 0, totalValue: 0 });
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [grantAmount, setGrantAmount] = useState(1);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar vendedores
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      if (!sellersRes.ok) throw new Error("Falha ao carregar vendedores.");
      const sellersData = await sellersRes.json();
      setSellers(sellersData);

      // Carregar status da roleta
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      if (!statusRes.ok) throw new Error("Falha ao carregar dados da roleta.");
      const statusData = await statusRes.json();

      setCreditsMap(statusData.creditsMap || {});
      setStats(statusData.stats || { totalSpins: 0, totalValue: 0 });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: error instanceof Error ? error.message : "Não foi possível buscar as informações."
      })
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      loadData();
    }
  }, [storeId]);


  const grantCredits = async () => {
    if (!selectedSeller || grantAmount < 1) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um vendedor e uma quantidade válida.'
      });
      return;
    }

    try {
      const res = await fetch('/api/wheel/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          sellerId: selectedSeller,
          credits: grantAmount,
          grantedBy: 'current_manager_id' // Adapte conforme seu sistema de auth
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Falha ao conceder giros.");
      }

      toast({
        title: 'Sucesso!',
        description: data.message
      });
      
      loadData(); // Recarrega todos os dados para refletir a mudança

      // Limpar seleção
      setSelectedSeller('');
      setGrantAmount(1);
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message
      });
    }
  };

  const sellersWithCredits = sellers.filter(seller => creditsMap[seller.id] > 0);
  const sellerNamesWithCredits = sellersWithCredits.map(seller => seller.name).join(', ');

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="mt-4 text-muted-foreground">Carregando gerenciador da roleta...</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Giros</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSpins ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Distribuído</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stats?.totalValue ?? 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card className="cursor-help">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vendedores com Giros</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                            {sellersWithCredits.length}
                            </div>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent>
                    {sellersWithCredits.length > 0 ? (
                        <p>{sellerNamesWithCredits}</p>
                    ) : (
                        <p>Nenhum vendedor tem giros disponíveis.</p>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      {/* Seção de concessão de giros */}
      <Card>
        <CardHeader>
          <CardTitle>Conceder Giros para Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Vendedor</label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
              >
                <option value="">Selecione um vendedor</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} {creditsMap[seller.id] > 0 && `(${creditsMap[seller.id]} giros)`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={grantAmount}
                onChange={(e) => setGrantAmount(parseInt(e.target.value) || 1)}
                className="w-full sm:w-24 mt-1"
              />
            </div>
            
            <Button onClick={grantCredits} className="w-full sm:w-auto">
              Conceder Giros
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

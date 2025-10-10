'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
  const [recentSpins, setRecentSpins] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSpins: 0, totalValue: 0 });
  const [selectedSeller, setSelectedSeller] = useState<string>('');
  const [grantAmount, setGrantAmount] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    try {
      // Carregar vendedores (adapte conforme sua API)
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      const sellersData = await sellersRes.json();
      setSellers(sellersData);

      // Carregar status da roleta
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      const statusData = await statusRes.json();
      setCreditsMap(statusData.creditsMap || {});
      setRecentSpins(Array.isArray(statusData.spins) ? statusData.spins.slice(0, 10) : []);
      setStats(statusData.stats || { totalSpins: 0, totalValue: 0 });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const grantCredits = async () => {
    if (!selectedSeller || grantAmount < 1) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um vendedor e quantidade válida'
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
        throw new Error(data.error);
      }

      toast({
        title: 'Sucesso!',
        description: data.message
      });

      // Atualizar créditos localmente
      setCreditsMap(prev => ({
        ...prev,
        [selectedSeller]: data.totalCredits
      }));

      // Limpar seleção
      setSelectedSeller('');
      setGrantAmount(1);
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Falha ao conceder giros'
      });
    }
  };

  const handleSpinResult = (result: any) => {
    // Atualizar créditos após giro
    if (result.sellerId && result.remainingCredits !== undefined) {
      setCreditsMap(prev => ({
        ...prev,
        [result.sellerId]: result.remainingCredits
      }));
    }

    // Recarregar dados para atualizar histórico
    loadData();
  };

  const sellersWithCredits = sellers.filter(seller => creditsMap[seller.id] > 0);
  const sellerNamesWithCredits = sellersWithCredits.map(seller => seller.name).join(', ');

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
                    <Card>
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
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Vendedor</label>
              <select
                value={selectedSeller}
                onChange={(e) => setSelectedSeller(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Selecione um vendedor</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} {creditsMap[seller.id] > 0 && `(${creditsMap[seller.id]} giros)`}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                min="1"
                max="10"
                value={grantAmount}
                onChange={(e) => setGrantAmount(parseInt(e.target.value) || 1)}
                className="w-20"
              />
            </div>
            
            <Button onClick={grantCredits}>
              Conceder Giros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vendedores com giros */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedores com Giros Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Giros Disponíveis</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers
                .filter(seller => creditsMap[seller.id] > 0)
                .map(seller => (
                <TableRow key={seller.id}>
                  <TableCell>{seller.name}</TableCell>
                  <TableCell>{creditsMap[seller.id] || 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Ativo</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {sellers.filter(seller => creditsMap[seller.id] > 0).length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhum vendedor com giros disponíveis
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Giros recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Giros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Prêmio</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSpins.map((spin: any) => (
                <TableRow key={spin.id}>
                  <TableCell>
                    {new Date(spin.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{sellers.find(s => s.id === spin.sellerId)?.name || spin.sellerId}</TableCell>
                  <TableCell>{spin.segment.label}</TableCell>
                  <TableCell>
                    <Badge variant={spin.status === 'paid' ? 'default' : 
                      spin.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {spin.status === 'paid' ? 'Pago' : 
                       spin.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {recentSpins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhum giro realizado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    

    



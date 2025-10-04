'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface WheelHistoryProps {
  storeId: string;
}

interface Seller {
  id: string;
  name: string;
}

export function WheelHistory({ storeId }: WheelHistoryProps) {
  const [spins, setSpins] = useState<any[]>([]);
  const [sellers, setSellers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch sellers
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      const sellersData = await sellersRes.json();
      const sellerMap = sellersData.reduce((acc: any, seller: Seller) => {
        acc[seller.id] = seller.name;
        return acc;
      }, {});
      setSellers(sellerMap);

      // Fetch history
      const historyRes = await fetch(`/api/wheel/status?storeId=${storeId}&limit=100`);
      if (!historyRes.ok) throw new Error("Failed to fetch history");
      const historyData = await historyRes.json();
      setSpins(historyData.spins || []);

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de giros.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeId]);
  
  const handleUpdateStatus = async (spinId: string, status: string) => {
    toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'Atualizar o status do prêmio ainda não foi implementado.'
    });
  }

  if (loading) {
    return <p>Carregando histórico...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico Completo de Giros</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Prêmio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Nenhum giro encontrado.</TableCell>
              </TableRow>
            ) : (
              spins.map((spin) => (
                <TableRow key={spin.id}>
                  <TableCell>{new Date(spin.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{sellers[spin.sellerId] || spin.sellerId}</TableCell> 
                  <TableCell>{spin.segment.label}</TableCell>
                  <TableCell>
                    <Badge variant={
                      spin.status === 'paid' ? 'default' : 
                      spin.status === 'pending' ? 'secondary' : 'destructive'
                    }>
                      {spin.status === 'paid' ? 'Pago' : 
                       spin.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUpdateStatus(spin.id, 'paid')}
                      disabled={spin.status !== 'pending'}
                    >
                      Marcar como Pago
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

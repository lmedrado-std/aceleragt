'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      const sellersData = await sellersRes.json();
      const sellerMap = sellersData.reduce((acc: any, seller: Seller) => {
        acc[seller.id] = seller.name;
        return acc;
      }, {});
      setSellers(sellerMap);

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
  
  const handleDeleteHistory = async () => {
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/wheel/history?storeId=${storeId}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Falha ao apagar o histórico.");
        }
        toast({
            title: "Histórico Apagado",
            description: "Todos os registros de giros foram removidos com sucesso."
        });
        loadData(); // Recarrega os dados para mostrar a tabela vazia
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Apagar",
            description: (error as Error).message,
        });
    } finally {
        setIsDeleting(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando histórico...
        </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Histórico Completo de Giros</CardTitle>
            <CardDescription>Visualize todos os prêmios sorteados pelos vendedores.</CardDescription>
        </div>
        {spins.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Histórico
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso irá remover permanentemente todos os registros de giros da roleta para esta loja.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHistory} className="bg-destructive hover:bg-destructive/90">
                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar e Apagar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Prêmio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">Nenhum giro encontrado.</TableCell>
              </TableRow>
            ) : (
              spins.map((spin) => (
                <TableRow key={spin.id}>
                  <TableCell>{new Date(spin.createdAt).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>{sellers[spin.seller_id] || spin.seller_id}</TableCell> 
                  <TableCell className="text-right font-medium">{spin.segment?.label || 'Prêmio desconhecido'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

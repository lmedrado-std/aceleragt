'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Archive } from 'lucide-react';
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

interface ArchivePeriodCardProps {
  storeId: string;
  onArchiveSuccess: () => void;
}

export function ArchivePeriodCard({ storeId, onArchiveSuccess }: ArchivePeriodCardProps) {
  const [periodName, setPeriodName] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const { toast } = useToast();

  const handleArchive = async () => {
    if (!periodName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome do Período Inválido',
        description: 'Por favor, insira um nome para o período (ex: Setembro/2024).',
      });
      return;
    }

    setIsArchiving(true);
    try {
      const res = await fetch('/api/archive-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, periodName }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao arquivar o período.');
      }

      const result = await res.json();

      toast({
        title: 'Período Arquivado com Sucesso!',
        description: result.message || 'Os dados foram salvos no histórico e os contadores zerados.',
      });
      
      setPeriodName('');
      onArchiveSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
      toast({
        variant: 'destructive',
        title: 'Erro ao Arquivar',
        description: errorMessage,
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Card className="bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <Archive className="h-6 w-6" />
          Arquivar Período de Vendas
        </CardTitle>
        <CardDescription className="text-amber-800 dark:text-amber-200">
          Esta ação irá salvar um registro histórico do desempenho atual de todos os vendedores e, em seguida, zerar suas métricas (Vendas, PA, Ticket Médio) para iniciar um novo ciclo de vendas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label htmlFor="period-name" className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Nome do Período (Obrigatório)
          </label>
          <Input
            id="period-name"
            placeholder="Ex: Setembro/2024, 1ª Quinzena Out, etc."
            value={periodName}
            onChange={(e) => setPeriodName(e.target.value)}
            disabled={isArchiving}
          />
        </div>
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={!periodName.trim() || isArchiving}>
              {isArchiving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Archive className="mr-2 h-4 w-4" />
              )}
              {isArchiving ? 'Arquivando...' : 'Arquivar e Zerar Contadores'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Arquivamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a salvar o desempenho de vendas do período <span className="font-bold">"{periodName}"</span> e zerar os contadores de todos os vendedores. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>
                Confirmar e Arquivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

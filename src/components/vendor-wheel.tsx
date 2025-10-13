'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface VendorWheelProps {
  storeId: string;
  sellerId: string;
  onSpin: (prize: any) => void; // Callback para notificar o componente pai sobre o prêmio
}

export function VendorWheel({ storeId, sellerId, onSpin }: VendorWheelProps) {
  const [credits, setCredits] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!storeId || !sellerId) return;

    // Função para carregar os créditos
    const fetchCredits = () => {
        fetch(`/api/wheel/status?storeId=${storeId}`)
        .then(res => res.json())
        .then(data => {
            if (data.creditsMap) {
                setCredits(data.creditsMap[sellerId] || 0);
            }
        })
        .catch(err => {
            console.error("Erro ao buscar créditos:", err);
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Não foi possível buscar os créditos da roleta.' });
        });
    };

    fetchCredits();
    // Recarrega a cada 30 segundos para manter os dados atualizados
    const interval = setInterval(fetchCredits, 30000);

    return () => clearInterval(interval);

  }, [storeId, sellerId, toast]);

  const handleSpin = async () => {
    if (credits < 1) {
      toast({ variant: 'destructive', title: 'Sem giros disponíveis' });
      return;
    }
    setSpinning(true);
    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao girar a roleta.');
      }

      toast({ 
        title: 'Você ganhou!', 
        description: `Prêmio: ${data.prize.label}`
      });

      // Notifica o componente pai sobre o prêmio e atualiza os créditos
      onSpin(data.prize);
      setCredits(data.remainingCredits);

    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no Giro', description: err.message });
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-6 p-4 bg-white rounded-lg shadow-md">
      <div className="text-center">
        <p className="text-lg text-gray-600">Você tem</p>
        <p className="text-5xl font-bold text-blue-600">{credits}</p>
        <p className="text-lg text-gray-600">giro(s) disponível(is)</p>
      </div>
      <Button
        onClick={handleSpin}
        disabled={spinning || credits < 1}
        className="w-full py-4 text-xl font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:bg-gray-400"
      >
        {spinning ? 'Girando...' : 'GIRAR A RODA'}
      </Button>
    </div>
  );
}

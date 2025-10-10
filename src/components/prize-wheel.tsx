"use client";
import { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface PrizeWheelProps {
  storeId: string;
  sellerId: string;
  onSpinResult?: (result: any) => void;
}

interface Segment {
  id: string;
  option: string;
  style?: {
    backgroundColor?: string;
    textColor?: string;
  };
  type: string;
  value?: number;
  description?: string;
}

export function PrizeWheel({ storeId, sellerId, onSpinResult }: PrizeWheelProps) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [credits, setCredits] = useState(0);
  const [spinResult, setSpinResult] = useState<Segment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setConfigured(null); // Reset on every load
      try {
        const settingsRes = await fetch(`/api/wheel/settings?storeId=${storeId}`);
        if (!settingsRes.ok) throw new Error('Falha ao verificar a configuração da roleta.');
        const settingsData = await settingsRes.json();

        if (settingsData.configured === false) {
          setConfigured(false);
          setSegments([]);
        } else {
          setConfigured(true);
          const formattedSegments = settingsData.segments?.map((s: any) => ({
            id: s.id,
            option: s.label,
            style: { backgroundColor: s.color || '#ffffff', textColor: '#000000' },
            type: s.type,
            value: s.value,
            description: s.description,
          })) || [];
          setSegments(formattedSegments);
          
          if (sellerId) {
            const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
            if (!statusRes.ok) throw new Error('Falha ao carregar seus giros.');
            const statusData = await statusRes.json();
            setCredits(statusData.creditsMap[sellerId] || 0);
          } else {
            setCredits(0);
          }
        }
      } catch (error) {
        setConfigured(false);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: (error as Error).message || 'Não foi possível carregar os dados da roleta.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      loadInitialData();
    }
  }, [storeId, sellerId, toast]);

  const handleSpinClick = async () => {
    if (credits > 0 && sellerId) {
      try {
        const res = await fetch('/api/wheel/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, sellerId }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Falha ao girar a roleta');
        }
        const result = await res.json();
        
        if (onSpinResult) {
          onSpinResult(result);
        }

        const prizeIndex = segments.findIndex(s => s.id === result.prize.id);

        if (prizeIndex !== -1) {
          setPrizeNumber(prizeIndex);
          setSpinResult(segments[prizeIndex]);
          setMustSpin(true);
          setCredits(prev => prev - 1);
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando roleta...</div>;
  }

  if (configured === false) {
    return (
      <div className="text-center p-8 bg-gray-100 rounded-lg">
        <p className="text-gray-600">A roleta ainda não foi configurada para esta loja.</p>
      </div>
    );
  }

  if (configured === true && segments.length === 0) {
    return (
      <div className="text-center p-8 bg-yellow-50 rounded-lg">
        <p className="text-yellow-800">Nenhum prêmio definido na roleta.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
        <div className="text-center text-lg font-semibold bg-primary text-primary-foreground py-2 px-4 rounded-lg shadow-md">
            <p>Você tem {credits} giro(s)</p>
        </div>
      
        <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={segments}
            onStopSpinning={() => {
                setMustSpin(false);
            }}
            radiusLineWidth={0}
            outerBorderWidth={5}
            fontSize={12}
        />

        <Button onClick={handleSpinClick} disabled={credits <= 0 || mustSpin || segments.length === 0 || !sellerId} className="w-full max-w-xs py-6 text-xl font-bold">
            {mustSpin ? 'GIRANDO...' : 'GIRAR'}
        </Button>

        <Dialog open={!!spinResult} onOpenChange={(isOpen) => !isOpen && setSpinResult(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Resultado do Giro</DialogTitle>
                    <DialogDescription>
                        {spinResult?.type === 'retry' ? 'Não foi desta vez!' : 'Parabéns!'}
                    </DialogDescription>
                </DialogHeader>
                <div className='py-4 text-center text-lg'>
                    <p>{spinResult?.option}</p>
                    {spinResult?.description && <p className='text-sm text-gray-500'>{spinResult.description}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

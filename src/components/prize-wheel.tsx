"use client";
import { useState, useEffect, useRef } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

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
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCredits = async () => {
    if (!storeId || !sellerId) return;
    try {
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      if (!statusRes.ok) return;
      const statusData = await statusRes.json();
      const newCredits = statusData.creditsMap[sellerId] || 0;
      setCredits(newCredits);
    } catch (error) {
       // Silently fail, don't show toast for polling
      console.error("Credit poll failed:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setConfigured(null);
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
            option: s.label.toUpperCase(),
            style: { backgroundColor: s.color || '#ffffff', textColor: '#ffffff' },
            type: s.type,
            value: s.value,
            description: s.description,
          })) || [];
          setSegments(formattedSegments);
          
          if (sellerId) {
            await fetchCredits();
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
      
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(fetchCredits, 10000); 
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [storeId, sellerId]);

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
    return (
        <div className="flex flex-col items-center justify-center h-96 w-full rounded-lg bg-muted/30">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando roleta de prêmios...</p>
        </div>
    );
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
        <div className="text-center text-lg font-semibold bg-primary text-primary-foreground py-2 px-4 rounded-full shadow-md">
            <p>Você tem {credits} giro(s)</p>
        </div>
        
        <div className="relative flex flex-col items-center">
            <div className="w-48 h-40 bg-yellow-800/20 dark:bg-yellow-200/20 rounded-t-lg shadow-inner-lg" style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)' }}></div>
            <div 
              className="absolute -top-2 z-10 w-0 h-0"
              style={{
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '30px solid hsl(var(--primary))',
              }}
            ></div>

            <div className="absolute top-12">
              <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={segments}
                  onStopSpinning={() => {
                      setMustSpin(false);
                  }}
                  radiusLineWidth={0}
                  outerBorderWidth={12}
                  outerBorderColor="hsl(var(--border))"
                  innerBorderWidth={0}
                  fontSize={14}
                  textDistance={75}
                  spinDuration={0.6}
              />
            </div>

            <div className="w-64 h-12 bg-yellow-800/10 dark:bg-yellow-200/10 rounded-b-lg mt-[-1px]"></div>
        </div>

        <Button onClick={handleSpinClick} disabled={credits <= 0 || mustSpin || segments.length === 0 || !sellerId} 
          className={cn("w-full max-w-xs py-6 text-xl font-bold rounded-full shadow-lg transition-transform transform hover:scale-105", 
          (credits <= 0 || mustSpin) && "opacity-50 cursor-not-allowed"
          )}>
            {mustSpin ? 'GIRANDO...' : 'GIRAR A ROLETA!'}
        </Button>

        <Dialog open={!!spinResult} onOpenChange={(isOpen) => !isOpen && setSpinResult(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">
                        {spinResult?.type === 'retry' ? 'Não foi desta vez!' : 'Parabéns! Você ganhou:'}
                    </DialogTitle>
                </DialogHeader>
                <div className='py-8 text-center text-4xl font-bold text-primary'>
                    <p>{spinResult?.option}</p>
                    {spinResult?.description && <p className='text-sm text-muted-foreground mt-2'>{spinResult.description}</p>}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" className="w-full">Fechar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  style?: { backgroundColor?: string; textColor?: string };
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
  const [showResult, setShowResult] = useState(false);
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCredits = async () => {
    if (!storeId || !sellerId) return;
    try {
      const statusRes = await fetch(`/api/wheel/status?storeId=${storeId}`);
      if (!statusRes.ok) return;
      const statusData = await statusRes.json();
      setCredits(statusData.creditsMap[sellerId] || 0);
    } catch {}
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const settingsRes = await fetch(`/api/wheel/settings?storeId=${storeId}`);
        if (!settingsRes.ok) throw new Error('Falha ao verificar configuração.');
        const { configured, segments } = await settingsRes.json();
        setConfigured(configured);
        if (configured) {
          setSegments(
            segments.map((s: any) => ({
              id: s.id,
              option: s.label.toUpperCase(),
              style: { backgroundColor: s.color, textColor: '#fff' },
              type: s.type,
              value: s.value,
              description: s.description,
            }))
          );
          await fetchCredits();
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Erro', description: err.message });
      } finally {
        setLoading(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(fetchCredits, 10000);
      }
    };
    if (storeId) loadInitialData();
    return () => pollingRef.current && clearInterval(pollingRef.current);
  }, [storeId, sellerId]);

  const handleSpinClick = async () => {
    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const result = await res.json();
      const idx = segments.findIndex((s) => s.id === result.prize.id);
      setPrizeNumber(idx);
      setSpinResult(segments[idx]);
      setCredits((c) => c - 1);
      setMustSpin(true);
      if (onSpinResult) onSpinResult(result);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (configured === false)
    return <p className="text-center p-8">Roleta não configurada.</p>;

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Créditos e Botão */}
      <div className="flex flex-col items-center gap-4">
        <span className="bg-primary text-white py-1 px-4 rounded-full">
          Você tem {credits} giro(s)
        </span>
        <Button
          onClick={handleSpinClick}
          disabled={credits <= 0 || mustSpin || segments.length === 0}
          className={cn(
            'w-40 py-2 text-lg font-bold rounded-full shadow-md transition',
            (credits <= 0 || mustSpin) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {mustSpin ? 'GIRANDO...' : 'GIRAR'}
        </Button>
      </div>

      {/* Roleta Aumentada em 20% */}
      <div className="relative mt-4 w-[120%] max-w-[480px]">
        <Wheel
          mustStartSpinning={mustSpin}
          prizeNumber={prizeNumber}
          data={segments}
          onStopSpinning={() => {
            setMustSpin(false);
            setShowResult(true);
          }}
          spinDuration={3}
          textDistance={65}
          fontSize={12}
          radiusLineWidth={0}
          outerBorderWidth={8}
          outerBorderColor="#ccc"
          innerBorderWidth={0}
        />
      </div>

      {/* Modal de Resultado com Acessibilidade */}
      {showResult && spinResult && (
        <Dialog open onOpenChange={() => setShowResult(false)}>
          <DialogContent aria-describedby="spin-result-description">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">
                {spinResult?.type === "retry"
                  ? "Não foi desta vez!"
                  : "Parabéns! Você ganhou:"}
              </DialogTitle>
              <DialogDescription id="spin-result-description" className="sr-only">
                {spinResult?.description || "Veja abaixo o prêmio sorteado."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center text-3xl font-bold text-primary">
              {spinResult?.option}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button className="w-full">Fechar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

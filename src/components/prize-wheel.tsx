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
import { Loader2, Gift } from 'lucide-react';
import { Card, CardContent } from './ui/card';

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
              style: { backgroundColor: s.color, textColor: '#FFFFFF' },
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
  }, [storeId, sellerId, toast]);

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
    return (
        <Card className="text-center p-8">
            <CardContent>
                <p className="text-muted-foreground">A roleta de prêmios ainda não foi configurada pelo gestor.</p>
            </CardContent>
        </Card>
    );

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-900 p-4 sm:p-6 rounded-2xl shadow-lg">
      <div className="flex flex-col items-center gap-6">
        
        <div className="text-center">
            <p className="font-semibold text-primary">Você tem</p>
            <p className="text-4xl font-bold text-foreground">{credits} giro(s)</p>
        </div>

        <div className="relative w-full flex justify-center items-center select-none">
            <div 
                className="absolute top-[-15px] z-10 w-0 h-0 
                border-l-[15px] border-l-transparent
                border-r-[15px] border-r-transparent
                border-t-[30px] border-t-red-600
                drop-shadow-md"
            />
            <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={segments}
                onStopSpinning={() => {
                    setMustSpin(false);
                    setShowResult(true);
                }}
                spinDuration={0.8}
                textDistance={65}
                fontSize={12}
                radiusLineWidth={2}
                radiusLineColor="rgba(255,255,255,0.2)"
                outerBorderWidth={12}
                outerBorderColor="#E2E8F0"
                innerBorderWidth={0}
                innerRadius={20}
                perpendicularText={false}
            />
        </div>

        <Button
          onClick={handleSpinClick}
          disabled={credits <= 0 || mustSpin || segments.length === 0}
          className={cn(
            'w-full max-w-xs py-6 text-xl font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105',
            'bg-green-600 hover:bg-green-700 text-white',
            (credits <= 0 || mustSpin) && 'opacity-50 cursor-not-allowed bg-gray-500 hover:bg-gray-500'
          )}
        >
          {mustSpin ? <Loader2 className="h-6 w-6 animate-spin" /> : <Gift className="mr-2 h-6 w-6" />}
          {mustSpin ? 'GIRANDO...' : 'GIRAR'}
        </Button>
      </div>

      {showResult && spinResult && (
        <Dialog open onOpenChange={() => setShowResult(false)}>
          <DialogContent aria-describedby="spin-result-description">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold">
                {spinResult?.type === "retry"
                  ? "Não foi desta vez!"
                  : "Parabéns! Você ganhou:"}
              </DialogTitle>
              <DialogDescription id="spin-result-description" className="sr-only">
                {spinResult?.description || "Veja abaixo o prêmio sorteado."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 text-center text-4xl font-extrabold text-primary tracking-tight">
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
    </Card>
  );
}

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
import { Loader2, Gift, Ticket } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import Image from 'next/image';

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
  color?: string;
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
              option: s.label,
              style: { 
                backgroundColor: s.type === 'retry' ? '#475569' : s.color, 
                textColor: '#FFFFFF' 
              },
              type: s.type,
              value: s.value,
              description: s.description,
              color: s.color,
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
    if (mustSpin) return;

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
      toast({ variant: 'destructive', title: 'Erro no Giro', description: err.message });
    }
  };

  // Sanitização de labels para a roleta
  const sanitizeLabel = (label: string) => {
    let clean = label.toUpperCase();
    if (clean.length > 12) return clean.substring(0, 10) + '..';
    return clean;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (configured === false)
    return (
        <Card className="text-center p-8 border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col items-center gap-4">
                <Gift className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground font-medium">A roleta de prêmios ainda não foi configurada.</p>
            </CardContent>
        </Card>
    );

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      
      {/* SEÇÃO DE GIROS - FORA DA ROLETA */}
      <Card className="border-none shadow-xl overflow-hidden bg-white dark:bg-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600" />
        <CardContent className="p-6 flex flex-col items-center justify-center relative">
            <div className="flex items-center gap-2 mb-1">
                <Ticket className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Giros Disponíveis
                </span>
            </div>
            
            <div className="relative flex items-center justify-center">
                <span className={cn(
                    "text-8xl sm:text-9xl font-black tracking-tighter leading-none transition-all duration-500",
                    credits > 0 ? "text-slate-900 dark:text-white" : "text-slate-200 dark:text-slate-800"
                )}>
                    {credits}
                </span>
                
                {credits > 0 && (
                    <div className="absolute -right-4 top-4">
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600"></span>
                        </span>
                    </div>
                )}
            </div>
            
            <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
                {credits === 1 ? 'Chances de ganhar' : 'Oportunidades'}
                <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>
        </CardContent>
      </Card>

      {/* CARD DA ROLETA */}
      <Card className="bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 border-none p-4 sm:p-8 rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        {/* Efeito de Vinheta */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
        
        {/* Elementos decorativos */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center gap-8 relative z-10">
          
          {/* Container da Roda */}
          <div className="relative w-[320px] sm:w-[380px] flex justify-center items-center select-none bg-white/10 p-2 rounded-full backdrop-blur-sm border border-white/10 shadow-2xl">
              
              {/* Ponteiro Amarelo Superior Refinado */}
              <div className="absolute top-[-14px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
                  <div className="w-9 h-11 bg-yellow-400 rounded-full rounded-bl-none rotate-45 shadow-xl flex items-center justify-center border-[3px] border-white overflow-hidden">
                      <div className="w-2.5 h-2.5 bg-slate-900 rounded-full -rotate-45" />
                  </div>
              </div>

              {/* Centro da Roleta Premium */}
              <div className="absolute z-20 w-20 h-20 sm:w-22 sm:h-22 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center bg-white ring-[6px] ring-blue-900/30">
                  <Gift className="w-10 h-10 sm:w-11 sm:h-11 text-blue-600 drop-shadow-sm" />
              </div>

              <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={segments.map(s => ({ 
                      ...s, 
                      option: sanitizeLabel(s.option),
                      style: { ...s.style, textColor: '#FFFFFF' }
                  }))}
                  onStopSpinning={() => {
                      setMustSpin(false);
                      setTimeout(() => setShowResult(true), 400);
                  }}
                  spinDuration={0.6}
                  textDistance={75}
                  fontSize={14}
                  radiusLineWidth={3}
                  radiusLineColor="rgba(255,255,255,0.5)"
                  outerBorderWidth={10}
                  outerBorderColor="#FFFFFF"
                  innerBorderWidth={0}
                  innerRadius={42}
                  perpendicularText={true}
                  pointerProps={{ style: { display: 'none' } }}
              />
          </div>

          {/* Botão de Ação */}
          <div className="w-full space-y-4">
              <Button
                  onClick={handleSpinClick}
                  disabled={credits <= 0 || mustSpin || segments.length === 0}
                  className={cn(
                      'w-full py-8 text-2xl font-black rounded-2xl shadow-2xl transition-all active:scale-95 uppercase tracking-tighter',
                      'bg-white text-blue-700 hover:bg-blue-50',
                      credits > 0 && !mustSpin && 'animate-subtle-pulse',
                      (credits <= 0 || mustSpin) && 'opacity-50 cursor-not-allowed grayscale animate-none shadow-none'
                  )}
              >
                  {mustSpin ? (
                      <span className="flex items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin" /> SORTEANDO...
                      </span>
                  ) : (
                      <span className="flex items-center gap-4">
                          <Gift className="h-10 w-10 text-blue-600" /> GIRAR AGORA!
                      </span>
                  )}
              </Button>
              
              {credits <= 0 && (
                  <p className="text-center text-blue-100/40 text-[10px] font-bold uppercase tracking-widest">
                      Fique atento aos novos lançamentos para ganhar giros
                  </p>
              )}
          </div>
        </div>
      </Card>

      {/* Modal de Resultado */}
      {showResult && spinResult && (
        <Dialog open onOpenChange={() => setShowResult(false)}>
          <DialogContent aria-describedby="spin-result-description" className="bg-gradient-to-br from-white to-blue-50 border-none shadow-2xl rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className={cn(
                  "text-center text-3xl font-black uppercase tracking-tighter",
                  spinResult.type === "retry" ? "text-slate-400" : "text-blue-600"
                )}>
                {spinResult.type === "retry" ? "😕 Não foi dessa vez!" : "🎉 Vitória!"}
              </DialogTitle>
              <DialogDescription id="spin-result-description" className="text-center font-bold text-slate-500">
                {spinResult.type === "retry" ? "Tente novamente na próxima carga de giros." : "Você acaba de ganhar um prêmio especial."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-10 text-center">
                <div className={cn(
                    "inline-block p-8 rounded-[2rem] text-white shadow-2xl",
                    spinResult.type === "retry" ? "bg-slate-500" : "bg-blue-600 shadow-blue-200"
                )}>
                    <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-2">Prêmio Conquistado</p>
                    <p className="text-4xl sm:text-5xl font-black tracking-tight">{spinResult?.option.toUpperCase()}</p>
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button className="w-full h-14 text-xl font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg">
                  CONTINUAR VENDENDO
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

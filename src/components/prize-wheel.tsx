'use client';
import { useState, useEffect, useRef } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from '@/lib/utils';
import { Loader2, Gift, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface PrizeWheelProps {
  storeId: string;
  sellerId: string;
  onSpinResult?: (result: any) => void;
}

interface Segment {
  id: string;
  label: string;
  option: string; // Icon
  style: { 
    backgroundColor: string; 
    textColor: string;
    boxShadow?: string;
  };
  type: string;
  value?: number;
  description?: string;
  color?: string;
}

const prizeIcons: { [key: string]: string } = {
    money: '💰',
    voucher: '⭐',
    product: '🎁',
    retry: '🔁',
    points: '🔥',
    default: '❌',
};

const prizeColors: { [key: string]: string } = {
    money: '#10B981',     // green-500 (prêmio real)
    product: '#10B981',    // green-500 (prêmio real)
    voucher: '#F59E0B',    // yellow-500 (bônus médio)
    points: '#A855F7',     // purple-500 (prêmio especial)
    retry: '#3B82F6',      // blue-500 (tentativa)
    default: '#6B7280',    // gray-500 (neutro)
};

const premiumGlow = 'inset 0 0 10px rgba(255,255,255,0.08), 0 0 12px rgba(255,255,255,0.05)';

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
        const { configured, segments: rawSegments } = await settingsRes.json();
        setConfigured(configured);
        if (configured) {
          setSegments(
            rawSegments.map((s: any): Segment => {
              const isPremium = ['money', 'product', 'voucher'].includes(s.type);
              return {
                id: s.id,
                label: s.label,
                option: prizeIcons[s.type] || prizeIcons.default,
                style: { 
                  backgroundColor: prizeColors[s.type] || prizeColors.default,
                  textColor: '#FFFFFF',
                  ...(isPremium && { boxShadow: premiumGlow })
                },
                type: s.type,
                value: s.value,
                description: s.description,
                color: s.color, // Keep original color for modal logic if needed
              }
            })
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
    if (mustSpin || credits <= 0) return;

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const result = await res.json();
      
      const idx = segments.findIndex((s) => s.id === result.prize.id);
      if (idx === -1) throw new Error("Prêmio não encontrado na roleta local.");

      setPrizeNumber(idx);
      
      // Use result.prize directly to guarantee absolute sync with the wheel and backend
      setSpinResult({
        ...result.prize,
        option: prizeIcons[result.prize.type] || prizeIcons.default,
        style: {
          backgroundColor: prizeColors[result.prize.type] || prizeColors.default,
          textColor: "#FFFFFF",
        }
      } as Segment);

      setCredits((c) => Math.max(0, c - 1));
      setMustSpin(true);
      
      if (onSpinResult) onSpinResult(result);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro no Giro', description: err.message });
    }
  };
  
  const prizeSegments = segments.filter(s => s.type !== 'retry');

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
    <div className="w-full max-w-lg mx-auto space-y-6 relative">
      
      <div className="flex justify-center">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900">
                <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Giros</span>
                <span className={cn(
                    "text-2xl font-black leading-none",
                    credits > 0 ? "text-blue-600" : "text-slate-300"
                )}>
                    {credits}
                </span>
            </div>
            {credits > 0 && (
                <span className="relative flex h-2 w-2 mb-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
            )}
        </div>
      </div>

      <Card className="bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 border-none p-4 sm:p-8 rounded-[3rem] shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
        
        <div className="flex flex-col items-center gap-8 relative z-10">
          
          <div className="relative w-[320px] sm:w-[380px] aspect-square flex justify-center items-center select-none bg-white/5 p-2 rounded-full backdrop-blur-sm border border-white/10 shadow-2xl">
              
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <div className="relative flex flex-col items-center">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full border-[4px] border-white flex items-center justify-center ring-2 ring-black/10">
                          <div className="w-3 h-3 bg-slate-900 rounded-full" />
                      </div>
                      <div 
                        className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-yellow-400 -mt-1"
                        style={{ filter: 'drop-shadow(0 2px 0 white)' }}
                      />
                  </div>
              </div>

              <div className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center bg-white ring-[6px] ring-blue-900/30">
                  <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>

              <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={segments}
                  onStopSpinning={() => {
                      setMustSpin(false);
                      setTimeout(() => setShowResult(true), 400);
                  }}
                  spinDuration={1.2}
                  perpendicularText={false}
                  textDistance={60}
                  fontSize={32}
                  radiusLineWidth={2}
                  radiusLineColor="rgba(255,255,255,0.35)"
                  outerBorderWidth={10}
                  outerBorderColor="#FFFFFF"
                  innerBorderWidth={0}
                  innerRadius={40}
                  pointerProps={{ style: { display: 'none' } }}
              />
          </div>

          <div className="w-full">
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
                      <span className="flex items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin" /> SORTEANDO...
                      </span>
                  ) : (
                      <span className="flex items-center justify-center gap-4">
                          <Gift className="h-10 w-10 text-blue-600" /> GIRAR AGORA!
                      </span>
                  )}
              </Button>
          </div>
        </div>
      </Card>

      {prizeSegments.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border border-white/20">
            <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400">Prêmios possíveis:</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {prizeSegments.map(prize => (
                        <li key={prize.id} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-xl" style={{ color: prizeColors[prize.type] || prizeColors.default }}>{prize.option}</span>
                            <span>{prize.label}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}

      {showResult && spinResult && (
        <Dialog open onOpenChange={() => setShowResult(false)}>
          <DialogContent 
            aria-describedby="spin-result-description" 
            className="p-0 border-none bg-transparent shadow-none max-w-sm"
            hideCloseButton={true}
          >
            <VisuallyHidden>
              <DialogTitle>Resultado do Giro</DialogTitle>
            </VisuallyHidden>

            {spinResult.type === 'retry' ? (
                <div className="bg-background rounded-2xl p-8 text-center space-y-6">
                    <h2 className="text-2xl font-black tracking-tight text-muted-foreground">
                        😕 NÃO FOI DESSA VEZ!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Continue vendendo para ganhar novos giros.
                    </p>
                    <DialogClose asChild>
                        <Button className="w-full h-12 text-base font-bold">
                            CONTINUAR VENDENDO
                        </Button>
                    </DialogClose>
              </div>
            ) : (
                <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-900/50 rounded-[2rem] p-8 text-center space-y-6 shadow-2xl">
                    <h2 className="text-3xl font-black tracking-tighter" style={{ color: prizeColors[spinResult.type] || prizeColors.default }}>🎉 PARABÉNS!</h2>
                    <p className="text-base text-slate-600 dark:text-slate-300 font-medium">Você ganhou:</p>
                    <div 
                        className="inline-block py-4 px-6 rounded-2xl text-white shadow-xl"
                        style={{ backgroundColor: prizeColors[spinResult.type] || prizeColors.default }}
                    >
                        <p className="text-3xl font-black tracking-tight break-words">{spinResult.label}</p>
                    </div>
                    <DialogClose asChild>
                        <Button className="w-full h-14 text-xl font-bold bg-slate-900 hover:bg-slate-800 dark:bg-primary-foreground dark:text-primary dark:hover:bg-slate-200 text-white rounded-2xl shadow-lg">
                            CONTINUAR VENDENDO
                        </Button>
                    </DialogClose>
                </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

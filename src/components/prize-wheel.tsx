
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
import Image from 'next/image';
import placeholderImages from '@/app/lib/placeholder-images.json';

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
              option: s.label,
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

  if (loading)
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (configured === false)
    return (
        <Card className="text-center p-8 border-none bg-blue-500/10">
            <CardContent>
                <p className="text-muted-foreground">A roleta de prêmios ainda não foi configurada pelo gestor.</p>
            </CardContent>
        </Card>
    );

  const { wheelCenterAvatar } = placeholderImages;

  return (
    <Card className="w-full max-w-lg mx-auto bg-gradient-to-b from-blue-400 to-blue-600 border-none p-4 sm:p-8 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Círculos decorativos de fundo */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center gap-8 relative z-10">
        
        <div className="text-center space-y-1">
            <p className="text-blue-100 font-black uppercase tracking-widest text-sm">Seus Giros Disponíveis</p>
            <p className="text-6xl font-black text-white drop-shadow-md">{credits}</p>
        </div>

        <div className="relative w-[320px] sm:w-[380px] flex justify-center items-center select-none bg-white/20 p-2 rounded-full backdrop-blur-sm">
            {/* Marcador Amarelo (Pointer) igual à imagem */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <div className="w-8 h-10 bg-yellow-400 rounded-full rounded-bl-none rotate-45 shadow-lg flex items-center justify-center border-2 border-white/50 relative overflow-hidden">
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full -rotate-45" />
                </div>
            </div>

            {/* Imagem Central Persona */}
            <div className="absolute z-20 w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                <Image 
                    src={wheelCenterAvatar.url}
                    width={wheelCenterAvatar.width}
                    height={wheelCenterAvatar.height}
                    alt={wheelCenterAvatar.alt}
                    data-ai-hint={wheelCenterAvatar.hint}
                    className="object-cover w-full h-full"
                />
            </div>

            <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={segments.map(s => ({ 
                    ...s, 
                    option: s.option.substring(0, 14).toUpperCase(),
                    style: { ...s.style, textColor: '#FFFFFF' }
                }))}
                onStopSpinning={() => {
                    setMustSpin(false);
                    setTimeout(() => setShowResult(true), 400);
                }}
                spinDuration={0.8}
                textDistance={65}
                fontSize={16}
                radiusLineWidth={4}
                radiusLineColor="#FFFFFF"
                outerBorderWidth={8}
                outerBorderColor="#FFFFFF"
                innerBorderWidth={0}
                innerRadius={35}
                perpendicularText={false}
            />
        </div>

        <div className="w-full space-y-4">
            <Button
                onClick={handleSpinClick}
                disabled={credits <= 0 || mustSpin || segments.length === 0}
                className={cn(
                    'w-full py-8 text-2xl font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-tighter',
                    'bg-white text-blue-600 hover:bg-blue-50',
                    (credits <= 0 || mustSpin) && 'opacity-50 cursor-not-allowed grayscale'
                )}
            >
                {mustSpin ? (
                    <span className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" /> Sorteando...
                    </span>
                ) : (
                    <span className="flex items-center gap-3">
                        <Gift className="h-8 w-8" /> Girar Agora!
                    </span>
                )}
            </Button>
            
            {credits <= 0 && (
                <p className="text-center text-blue-100/80 text-xs font-bold uppercase tracking-widest">
                    Aguarde o gestor liberar novos giros
                </p>
            )}
        </div>
      </div>

      {showResult && spinResult && (
        <Dialog open onOpenChange={() => setShowResult(false)}>
          <DialogContent aria-describedby="spin-result-description" className="bg-gradient-to-br from-white to-blue-50 border-none shadow-2xl">
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
                <div className="inline-block p-6 rounded-3xl bg-blue-600 text-white shadow-2xl shadow-blue-200">
                    <p className="text-sm font-black uppercase tracking-widest opacity-70 mb-1">Prêmio Conquistado</p>
                    <p className="text-4xl font-black tracking-tight">{spinResult?.option}</p>
                </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button className="w-full h-12 text-lg font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                  Continuar Vendendo
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

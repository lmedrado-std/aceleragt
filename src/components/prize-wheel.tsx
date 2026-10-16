'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Loader2, RotateCw, Ticket, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { indexAtAngle, targetRotation } from '@/lib/wheel/engine';
import { WheelSvg, prizeIcon, type WheelSvgSlice } from '@/components/wheel/wheel-svg';
import {
  playRetry,
  playTick,
  playWin,
  readMutedPreference,
  saveMutedPreference,
  startSuspense,
  unlockAudio,
} from '@/components/wheel/wheel-audio';
import styles from '@/components/wheel/prize-wheel.module.css';

interface PrizeWheelProps {
  storeId: string;
  sellerId: string;
  /** Chamado depois que a roda para, com a resposta do servidor (inclui remainingCredits). */
  onSpinResult?: (result: SpinResponse) => void;
}

interface Slice extends WheelSvgSlice {
  value: number | null;
  description: string | null;
}

export interface SpinResponse {
  spinId: string;
  remainingCredits: number;
  prize: { id: string; label: string; type: string; value: number | null; description: string | null; color: string };
  wheelSnapshot: Slice[];
  selectedIndex: number;
  stopAngleDeg: number;
}

type Phase = 'loading' | 'idle' | 'requesting' | 'spinning' | 'result';

/** Duração aprovada para o vendedor (~9 s). */
export const SPIN_DURATION_MS = 9000;
const SPIN_TURNS = 8;
const REDUCED_DURATION_MS = 1200;
const EASING = 'cubic-bezier(.07,.72,.04,1)';
const POLL_MS = 30000;

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function PrizeWheel({ storeId, sellerId, onSpinResult }: PrizeWheelProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [slices, setSlices] = useState<Slice[]>([]);
  const [credits, setCredits] = useState(0);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<SpinResponse | null>(null);
  const [muted, setMuted] = useState(false);

  const rotorRef = useRef<SVGGElement>(null);
  const wheelAreaRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const lockRef = useRef(false); // trava síncrona: impede o segundo clique antes do React re-renderizar
  const mutedRef = useRef(false);
  const phaseRef = useRef<Phase>('loading');
  const mountedRef = useRef(true);
  phaseRef.current = phase;

  useEffect(() => {
    mountedRef.current = true;
    const m = readMutedPreference();
    setMuted(m);
    mutedRef.current = m;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadWheel = useCallback(async () => {
    const res = await fetch(`/api/wheel/settings?storeId=${encodeURIComponent(storeId)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Não foi possível carregar a roleta.');
    const data = await res.json();
    const wheel: Slice[] = Array.isArray(data.wheel) ? data.wheel : [];
    if (mountedRef.current && (phaseRef.current === 'idle' || phaseRef.current === 'loading' || phaseRef.current === 'result')) {
      setSlices(wheel);
    }
  }, [storeId]);

  const loadCredits = useCallback(async () => {
    const res = await fetch(
      `/api/wheel/status?storeId=${encodeURIComponent(storeId)}&sellerId=${encodeURIComponent(sellerId)}&limit=1`,
      { cache: 'no-store' },
    );
    if (!res.ok) return;
    const data = await res.json();
    if (mountedRef.current && typeof data.credits === 'number') setCredits(data.credits);
  }, [storeId, sellerId]);

  useEffect(() => {
    if (!storeId || !sellerId) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadWheel(), loadCredits()]);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setPhase('idle');
      }
    })();
    // Atualiza saldo e prêmios periodicamente, mas nunca durante um giro.
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (phaseRef.current !== 'idle' && phaseRef.current !== 'result') return;
      void loadCredits();
      void loadWheel().catch(() => {});
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [storeId, sellerId, loadWheel, loadCredits]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    saveMutedPreference(next);
    if (!next) unlockAudio(); // o próprio clique serve de gesto para liberar o áudio
  };

  const animateTo = async (data: SpinResponse) => {
    const snapshot = data.wheelSnapshot;
    setSlices(snapshot);
    await nextFrame(); // garante que a roda foi redesenhada com o snapshot do servidor

    const el = rotorRef.current;
    if (!el) throw new Error('Roleta indisponível.');
    const reduced = prefersReducedMotion();
    const duration = reduced ? REDUCED_DURATION_MS : SPIN_DURATION_MS;
    const from = angleRef.current;
    const to = targetRotation(from, data.stopAngleDeg, reduced ? 1 : SPIN_TURNS);

    const sound = !mutedRef.current && !reduced;
    const stopSuspense = sound ? startSuspense(duration) : () => {};
    let tickDelay = 70;
    let tickTimer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (!mutedRef.current) playTick();
      tickDelay = Math.min(330, tickDelay * 1.045);
      tickTimer = setTimeout(tick, tickDelay);
    };
    if (sound) tick();

    setPhase('spinning');
    setHint('✨ Começou... boa sorte!');
    const hints: [number, string][] = [
      [0.45, '👀 Olha onde ela vai parar...'],
      [0.7, '🤞 Está chegando...'],
      [0.88, '😮 Quase...'],
    ];
    const hintTimers = reduced ? [] : hints.map(([at, text]) => setTimeout(() => mountedRef.current && setHint(text), duration * at));

    const anim = el.animate([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }], {
      duration,
      easing: EASING,
      fill: 'forwards',
    });
    try {
      await anim.finished;
    } finally {
      if (tickTimer) clearTimeout(tickTimer);
      hintTimers.forEach(clearTimeout);
      stopSuspense();
    }
    el.style.transform = `rotate(${to}deg)`;
    anim.cancel();
    angleRef.current = to;

    // Conferência: a fatia sob o ponteiro tem que ser a que o servidor gravou.
    const landed = indexAtAngle(snapshot.length, to);
    if (landed !== data.selectedIndex || snapshot[landed]?.id !== data.prize.id) {
      console.error('[Roleta] divergência visual', { landed, selectedIndex: data.selectedIndex, prize: data.prize.id });
    }
    return { reduced };
  };

  const handleSpin = async () => {
    if (lockRef.current || phase === 'loading' || credits <= 0 || slices.length === 0) return;
    lockRef.current = true;
    if (!mutedRef.current) unlockAudio(); // precisa acontecer dentro do gesto do clique
    setError('');
    setResult(null);
    setPhase('requesting');
    setHint('🍀 Preparando sua sorte...');
    wheelAreaRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });

    try {
      const res = await fetch('/api/wheel/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, sellerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.noCredits) setCredits(0);
        if (data?.notConfigured) void loadWheel().catch(() => {});
        throw new Error(data?.error || 'Não foi possível girar a roleta.');
      }

      const spin = data as SpinResponse;
      const { reduced } = await animateTo(spin);
      if (!mountedRef.current) return;

      setCredits(spin.remainingCredits);
      setResult(spin);
      setPhase('result');
      const isRetry = spin.prize.type === 'retry';
      setHint(isRetry ? 'Não foi dessa vez. Continue vendendo!' : '🎉 Parabéns! Seu prêmio foi registrado.');
      if (!mutedRef.current) (isRetry ? playRetry : playWin)();
      if (!isRetry) {
        try {
          navigator.vibrate?.([90, 50, 180]);
        } catch {
          /* ignora */
        }
        if (!reduced) {
          confetti({
            particleCount: 140,
            spread: 75,
            origin: { y: 0.55 },
            colors: [spin.prize.color, '#00B7A8', '#005A73', '#FFFFFF', '#FDE047'],
            disableForReducedMotion: true,
          });
        }
      }
      onSpinResult?.(spin);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 400);
    } catch (e) {
      if (!mountedRef.current) return;
      setError((e as Error).message || 'Falha de conexão. O crédito só é descontado quando o giro é registrado.');
      setHint('');
      setPhase('idle');
      void loadCredits();
    } finally {
      lockRef.current = false;
    }
  };

  const busy = phase === 'requesting' || phase === 'spinning';

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-96 w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (slices.length === 0 && !busy) {
    return (
      <Card className="text-center p-8 border-dashed border-2 bg-muted/20">
        <CardContent className="flex flex-col items-center gap-4">
          <Gift className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            {error || 'A roleta de prêmios ainda não foi configurada.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isRetry = result?.prize.type === 'retry';

  return (
    <div className="w-full max-w-xl mx-auto space-y-5" data-testid="prize-wheel">
      <div className="flex items-center justify-between gap-3">
        <div
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pl-2 pr-5 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-3"
          data-testid="wheel-credits"
          data-credits={credits}
        >
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
            <Ticket className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">
              Giros disponíveis
            </span>
            <span className={cn('text-2xl font-black leading-none', credits > 0 ? 'text-primary' : 'text-muted-foreground/60')}>
              {credits}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? 'Ativar som da roleta' : 'Silenciar roleta'}
          title={muted ? 'Ativar som' : 'Silenciar'}
          className="rounded-full h-11 w-11"
          data-testid="wheel-mute"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
      </div>

      <div ref={wheelAreaRef} className="rounded-[2rem] bg-gradient-to-b from-primary/10 via-background to-accent/10 px-2 py-6 sm:px-6">
        <WheelSvg ref={rotorRef} slices={slices} />
        <div className={cn(styles.hint, busy && styles.suspense)} aria-live="polite" data-testid="wheel-hint">
          {hint}
        </div>
        <div className="px-2 sm:px-8">
          <Button
            onClick={handleSpin}
            disabled={busy || credits <= 0 || slices.length === 0}
            aria-busy={busy}
            data-testid="wheel-spin"
            className={cn(
              'w-full h-16 text-xl font-black rounded-2xl shadow-xl uppercase tracking-tight transition-transform active:scale-95',
              credits > 0 && !busy && 'animate-subtle-pulse',
            )}
          >
            {busy ? (
              <span className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin" /> Roleta em andamento...
              </span>
            ) : credits > 0 ? (
              <span className="flex items-center gap-3">
                <Gift className="h-6 w-6" /> {result ? 'Girar de novo' : 'Girar agora'}
              </span>
            ) : (
              'Sem giros disponíveis'
            )}
          </Button>
          {error && (
            <p className="mt-3 text-center text-sm font-semibold text-destructive" role="alert" data-testid="wheel-error">
              {error}
            </p>
          )}
        </div>
      </div>

      {result && phase === 'result' && (
        <div ref={resultRef} className={styles.reveal} role="status" aria-live="polite" data-testid="wheel-result" data-prize-id={result.prize.id}>
          <Card className="overflow-hidden border-none shadow-2xl">
            <div
              className="px-6 pt-7 pb-6 text-center text-white"
              style={{ background: isRetry ? 'linear-gradient(145deg,#64748B,#334155)' : `linear-gradient(145deg, ${result.prize.color}, hsl(193 100% 18%))` }}
            >
              <div className={cn('text-5xl', styles.pop)}>{isRetry ? '😕' : '🎉'}</div>
              <div className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] opacity-85">
                {isRetry ? 'Não foi dessa vez' : 'Seu prêmio'}
              </div>
              <h3 className="mt-1 text-3xl font-black tracking-tight break-words" data-testid="wheel-result-label">
                {prizeIcon(result.prize.type)} {result.prize.label}
              </h3>
              {result.prize.description && <p className="mt-2 text-sm opacity-90">{result.prize.description}</p>}
            </div>
            <CardContent className="p-5 space-y-4">
              {!isRetry && result.prize.type === 'money' && result.prize.value != null && (
                <div className={cn('rounded-xl p-4 text-center', styles.ticket)}>
                  <small className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</small>
                  <div className="text-3xl font-black text-primary">{brl(result.prize.value)}</div>
                </div>
              )}
              <p className="text-center text-sm text-muted-foreground">
                {isRetry
                  ? 'Continue vendendo para ganhar novos giros.'
                  : 'Prêmio registrado. Combine o resgate com o seu gestor.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {result.remainingCredits > 0 ? (
                  <Button className="flex-1 h-12 font-bold" onClick={handleSpin} disabled={busy}>
                    <RotateCw className="mr-2 h-4 w-4" /> Girar de novo ({result.remainingCredits})
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={() => {
                    setResult(null);
                    setPhase('idle');
                    setHint('');
                  }}
                >
                  Continuar vendendo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border border-white/20">
        <CardContent className="p-5">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Prêmios da roleta</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {slices.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium">
                <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: s.color }} />
                <span className="text-base">{prizeIcon(s.type)}</span>
                <span className="truncate">{s.label}</span>
                {s.type === 'money' && s.value != null && (
                  <span className="ml-auto shrink-0 font-bold text-primary">{brl(s.value)}</span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

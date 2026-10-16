'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Gift, Loader2, Rocket, Ticket, Trophy, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { indexAtAngle, targetRotation } from '@/lib/wheel/engine';
import {
  createSpinMotion,
  REDUCED_TOTAL_MS,
  REDUCED_TURNS,
  safeOvershoot,
  SPIN_TOTAL_MS,
  SPIN_TURNS_FULL,
} from '@/lib/wheel/motion';
import { WheelSvg, prizeIcon, type WheelSvgSlice, type WheelVisualState } from '@/components/wheel/wheel-svg';
import { WheelCelebration } from '@/components/wheel/wheel-celebration';
import {
  playFanfare,
  playRetry,
  playStop,
  playTick,
  readMutedPreference,
  saveMutedPreference,
  setAudioMuted,
  startSpinSound,
  stopAllSounds,
  unlockAudio,
  type SpinSoundController,
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

type Phase = 'loading' | 'idle' | 'requesting' | 'spinning' | 'celebrating';

/** Duração efetiva da rotação (aprovada: ~12 s). */
export const SPIN_DURATION_MS = SPIN_TOTAL_MS;
/** Pausa entre a parada da roda e a abertura da celebração (a "respiração" antes da revelação). */
const REVEAL_DELAY_MS = 450;
const FINALE_LEAD_MS = 3200;
const POLL_MS = 30000;

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
const mod360 = (d: number) => ((d % 360) + 360) % 360;

/** Mensagens de suspense ao longo do giro (fração do tempo total). */
const SPIN_HINTS: [number, string][] = [
  [0, '✨ Começou... boa sorte!'],
  [0.28, '🔥 Girando forte!'],
  [0.5, '👀 Olha onde ela vai parar...'],
  [0.72, '🤞 Está chegando...'],
  [0.88, '😮 Quase... quase...'],
];

export function PrizeWheel({ storeId, sellerId, onSpinResult }: PrizeWheelProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [slices, setSlices] = useState<Slice[]>([]);
  const [credits, setCredits] = useState(0);
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [visual, setVisual] = useState<WheelVisualState>('idle');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [celebration, setCelebration] = useState<(SpinResponse & { reduced: boolean }) | null>(null);
  const [lastResult, setLastResult] = useState<SpinResponse | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const wheelAreaRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const lockRef = useRef(false); // trava síncrona: impede o segundo clique antes do React re-renderizar
  const mutedRef = useRef(false);
  const phaseRef = useRef<Phase>('loading');
  const mountedRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const soundRef = useRef<SpinSoundController | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  phaseRef.current = phase;

  useEffect(() => {
    mountedRef.current = true;
    const m = readMutedPreference();
    setMuted(m);
    mutedRef.current = m;
    setAudioMuted(m);
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      soundRef.current?.stop();
      stopAllSounds();
    };
  }, []);

  const loadWheel = useCallback(async () => {
    const res = await fetch(`/api/wheel/settings?storeId=${encodeURIComponent(storeId)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Não foi possível carregar a roleta.');
    const data = await res.json();
    const wheel: Slice[] = Array.isArray(data.wheel) ? data.wheel : [];
    if (mountedRef.current && (phaseRef.current === 'idle' || phaseRef.current === 'loading')) {
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
    // Atualiza saldo e prêmios periodicamente, mas nunca durante um giro ou celebração.
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible' || phaseRef.current !== 'idle') return;
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
    setAudioMuted(next); // silencia na hora, inclusive no meio do giro
    if (!next) unlockAudio(); // o próprio clique serve de gesto para liberar o áudio
  };

  const flapPointer = (speed: number) => {
    const el = pointerRef.current;
    if (!el?.animate) return;
    const kick = 9 + 15 * (1 - speed); // devagar, o ponteiro "bate" mais forte em cada pino
    el.animate([{ rotate: `${-kick}deg` }, { rotate: '0deg' }], {
      duration: 120 + 200 * (1 - speed),
      easing: 'cubic-bezier(.25,1.7,.45,1)',
    });
  };

  /**
   * Anima até o ângulo calculado a partir do stopAngleDeg do servidor.
   * Duração FIXA (12 s, ou 3 s com movimento reduzido), independente de quão rápido o servidor respondeu.
   */
  const runSpinAnimation = (data: SpinResponse, reduced: boolean) =>
    new Promise<void>((resolve, reject) => {
      const el = rotorRef.current;
      if (!el) {
        reject(new Error('Roleta indisponível.'));
        return;
      }
      const snapshot = data.wheelSnapshot;
      const n = snapshot.length;
      const duration = reduced ? REDUCED_TOTAL_MS : SPIN_TOTAL_MS;
      // normaliza o ponto de partida (mesma posição visual, números pequenos)
      const from = mod360(angleRef.current);
      el.style.transform = `rotate(${from}deg)`;
      const to = targetRotation(from, data.stopAngleDeg, reduced ? REDUCED_TURNS : SPIN_TURNS_FULL);
      const overshoot = reduced ? 0 : safeOvershoot(n, data.selectedIndex, data.stopAngleDeg);
      const motion = createSpinMotion({ from, to, durationMs: duration, overshootDeg: overshoot });

      soundRef.current?.stop();
      stopAllSounds(); // nunca acumula sons de um giro anterior
      const sound = startSpinSound(duration);
      soundRef.current = sound;

      let lastIdx = indexAtAngle(n, from);
      let ticks = 0;
      let hintStep = 0;
      let finale = false;
      let start: number | null = null;
      const root = rootRef.current;
      if (root) {
        root.dataset.ticks = '0';
        root.dataset.spinStartedAt = '';
      }

      const frame = (now: number) => {
        if (!mountedRef.current) return;
        if (start === null) {
          start = now;
          if (root) root.dataset.spinStartedAt = String(Date.now());
        }
        const t = now - start;
        const angle = motion.angleAt(t);
        el.style.transform = `rotate(${angle}deg)`;
        const speed = motion.speedAt(t);
        sound.setSpeed(speed);

        const idx = indexAtAngle(n, angle);
        if (idx !== lastIdx) {
          lastIdx = idx;
          ticks++;
          playTick(speed);
          if (!reduced) {
            flapPointer(speed);
            if (t > duration - 2600) {
              try {
                navigator.vibrate?.(8);
              } catch {
                /* ignora */
              }
            }
          }
          if (root) root.dataset.ticks = String(ticks);
        }
        while (hintStep < SPIN_HINTS.length && t >= SPIN_HINTS[hintStep][0] * duration) {
          setHint(SPIN_HINTS[hintStep][1]);
          hintStep++;
        }
        if (!finale && !reduced && t >= duration - FINALE_LEAD_MS) {
          finale = true;
          setVisual('finale');
        }

        if (t >= duration) {
          rafRef.current = null;
          el.style.transform = `rotate(${to}deg)`;
          angleRef.current = to;
          sound.stop();
          if (root) root.dataset.lastSpinMs = String(Math.round(t));
          resolve();
          return;
        }
        rafRef.current = requestAnimationFrame(frame);
      };
      rafRef.current = requestAnimationFrame(frame);
    });

  const handleSpin = async () => {
    if (lockRef.current || phaseRef.current === 'loading' || phaseRef.current === 'spinning' || credits <= 0 || slices.length === 0) return;
    lockRef.current = true;
    if (!mutedRef.current) unlockAudio(); // precisa acontecer dentro do gesto do clique
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    setCelebration(null);
    setError('');
    setHighlight(null);
    setVisual('idle');
    setPhase('requesting');
    setHint('🍀 Preparando sua sorte...');
    const reduced = prefersReducedMotion();
    wheelAreaRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });

    try {
      // O resultado vem do servidor ANTES da animação; o navegador nunca sorteia.
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

      // Redesenha a roda com as fatias exatas do sorteio antes de girar.
      setSlices(spin.wheelSnapshot);
      await nextFrame();
      setPhase('spinning');
      setVisual('spinning');
      await runSpinAnimation(spin, reduced);
      if (!mountedRef.current) return;

      // Conferência: a fatia sob o ponteiro tem que ser a que o servidor gravou.
      const n = spin.wheelSnapshot.length;
      const landed = indexAtAngle(n, angleRef.current);
      if (landed !== spin.selectedIndex || spin.wheelSnapshot[landed]?.id !== spin.prize.id) {
        console.error('[Roleta] divergência visual', { landed, selectedIndex: spin.selectedIndex, prize: spin.prize.id });
      }

      const isRetry = spin.prize.type === 'retry';
      playStop();
      setHighlight(spin.selectedIndex);
      setVisual(isRetry ? 'lost' : 'won');
      setHint(isRetry ? 'Não foi dessa vez...' : '🎉 Parou! Veja o seu prêmio!');
      setCredits(spin.remainingCredits);
      setLastResult(spin);
      if (!isRetry) {
        try {
          navigator.vibrate?.([90, 50, 180]);
        } catch {
          /* ignora */
        }
      }

      // Revelação só depois que a roda parou, com som sincronizado à abertura do cartão.
      await new Promise<void>((r) => {
        revealTimerRef.current = setTimeout(r, reduced ? 150 : REVEAL_DELAY_MS);
      });
      if (!mountedRef.current) return;
      setPhase('celebrating');
      setCelebration({ ...spin, reduced });
      if (isRetry) playRetry();
      else playFanfare();
      onSpinResult?.(spin);
    } catch (e) {
      if (!mountedRef.current) return;
      soundRef.current?.stop();
      stopAllSounds();
      setVisual('idle');
      setError((e as Error).message || 'Falha de conexão. O crédito só é descontado quando o giro é registrado.');
      setHint('');
      setPhase('idle');
      void loadCredits();
    } finally {
      lockRef.current = false;
    }
  };

  const closeCelebration = useCallback(() => {
    setCelebration(null);
    setPhase('idle');
    setVisual('idle');
    setHint('');
  }, []);

  const spinAgain = () => {
    closeCelebration();
    phaseRef.current = 'idle';
    void handleSpin();
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
          <p className="text-muted-foreground font-medium">{error || 'A roleta de prêmios ainda não foi configurada.'}</p>
        </CardContent>
      </Card>
    );
  }

  const idleHint =
    credits > 0
      ? `Você tem ${credits} giro${credits > 1 ? 's' : ''}. Gire e descubra seu prêmio ✨`
      : 'Continue vendendo para ganhar novos giros ✨';

  return (
    <div ref={rootRef} className={cn(styles.theme, 'w-full max-w-6xl mx-auto')} data-testid="prize-wheel" data-phase={phase}>
      <div className={styles.layout}>
        {/* Coluna da roleta: no topo em qualquer tela */}
        <div ref={wheelAreaRef} className={cn(styles.stage, 'px-1 pt-2 pb-3 sm:px-4')} data-state={visual === 'finale' ? 'finale' : undefined}>
          <WheelSvg ref={rotorRef} pointerRef={pointerRef} slices={slices} state={visual} highlightIndex={highlight} />
          <div className={cn(styles.hint, busy && styles.suspense)} aria-live="polite" data-testid="wheel-hint">
            {hint || idleHint}
          </div>
          <div className="mx-auto max-w-md px-2">
            <Button
              onClick={handleSpin}
              disabled={busy || phase === 'celebrating' || credits <= 0 || slices.length === 0}
              aria-busy={busy}
              data-testid="wheel-spin"
              className={cn(
                'w-full h-16 text-xl font-black rounded-2xl uppercase tracking-tight transition-transform active:scale-95',
                styles.spinButton,
                credits > 0 && !busy && 'animate-subtle-pulse',
              )}
            >
              {busy ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin" /> Roleta em andamento...
                </span>
              ) : credits > 0 ? (
                <span className="flex items-center gap-3">
                  <Gift className="h-6 w-6" /> {lastResult ? 'Girar de novo' : 'Girar agora'}
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

        {/* Coluna lateral: textos, saldo e prêmios */}
        <aside className={cn(styles.side, 'space-y-4')}>
          <header className={styles.brand}>
            <div className={styles.brandTile} aria-hidden="true">
              <Rocket className="mb-1 h-5 w-5" />
              acelera
              <span>GT</span>
            </div>
            <div className="min-w-0">
              <div className={styles.eyebrow}>Experiência Acelera GT</div>
              <h2 className={styles.title}>Gire &amp; Ganhe</h2>
              <p className={styles.subtitle}>Bateu a meta? Sua próxima conquista pode começar com uma surpresa.</p>
            </div>
          </header>

          <div className="flex items-center justify-between gap-3">
            <div
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pl-2 pr-5 py-2 rounded-full shadow-lg border border-white/20 flex items-center gap-3"
              data-testid="wheel-credits"
              data-credits={credits}
            >
              <div className={cn('flex items-center justify-center h-9 w-9 rounded-full', styles.accentSoft)}>
                <Ticket className={cn('h-4 w-4', styles.accentText)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">Giros disponíveis</span>
                <span className={cn('text-2xl font-black leading-none', credits > 0 ? styles.accentText : 'text-muted-foreground/60')}>
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

          {lastResult && phase !== 'spinning' && phase !== 'requesting' && (
            <div className="flex items-center gap-3 rounded-2xl border bg-white/80 px-4 py-3 text-sm shadow-sm dark:bg-slate-900/80" data-testid="wheel-last-result">
              <Trophy className={cn('h-5 w-5 shrink-0', styles.accentText)} />
              <span className="text-muted-foreground">Último resultado:</span>
              <span className="truncate font-bold">
                {prizeIcon(lastResult.prize.type)} {lastResult.prize.label}
              </span>
            </div>
          )}

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border border-white/20">
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Prêmios da roleta</p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {slices.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm font-medium">
                    <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ backgroundColor: s.color }} />
                    <span className="text-base">{prizeIcon(s.type)}</span>
                    <span className="truncate">{s.label}</span>
                    {s.type === 'money' && s.value != null && (
                      <span className={cn('ml-auto shrink-0 font-bold', styles.accentText)}>{brl(s.value)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {celebration && (
        <WheelCelebration
          spinId={celebration.spinId}
          prize={celebration.prize}
          remainingCredits={celebration.remainingCredits}
          reducedMotion={celebration.reduced}
          onClose={closeCelebration}
          onSpinAgain={spinAgain}
        />
      )}
    </div>
  );
}

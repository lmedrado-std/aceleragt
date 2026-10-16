'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { prizeIcon } from '@/components/wheel/wheel-svg';
import styles from '@/components/wheel/prize-wheel.module.css';

export interface CelebrationPrize {
  id: string;
  label: string;
  type: string;
  value: number | null;
  description: string | null;
  color: string;
}

interface WheelCelebrationProps {
  spinId: string;
  prize: CelebrationPrize;
  remainingCredits: number;
  reducedMotion: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
}

/** Duração dos efeitos visuais de vitória (o cartão fica até o vendedor fechar). */
export const CELEBRATION_EFFECTS_MS = 5200;

const BRAND = ['#344792', '#5267a8', '#F2446A', '#FDE047', '#00B7A8', '#FFFFFF'];
const BALLOON_COLORS = ['#F2446A', '#FDE047', '#00B7A8', '#5267a8', '#F97316', '#7C3AED', '#16A34A', '#0EA5E9'];

// Giros já celebrados nesta aba: re-renderizar ou remontar o componente nunca repete a festa.
const celebrated = new Set<string>();

const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function WheelCelebration({ spinId, prize, remainingCredits, reducedMotion, onClose, onSpinAgain }: WheelCelebrationProps) {
  const isRetry = prize.type === 'retry';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [effectsOn, setEffectsOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Ancora a celebração na área VISÍVEL da tela. Em celulares, se algo na página for mais
  // largo que a tela, `position: fixed; inset: 0` passa a usar a largura da página inteira e o
  // cartão sai do centro. O visualViewport sempre corresponde ao que o vendedor está vendo.
  const [viewport, setViewport] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setViewport({ left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height });
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // Balões e brilhos sorteados uma única vez por celebração.
  const balloons = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: `${rand(2, 94)}%`,
        delay: `${rand(0, 1.4).toFixed(2)}s`,
        dur: `${rand(4.4, 6).toFixed(2)}s`,
        sway: `${Math.round(rand(-40, 40))}px`,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length],
        scale: rand(0.75, 1.15),
      })),
    [spinId],
  );
  const sparkles = useMemo(
    () => Array.from({ length: 12 }, () => ({ top: `${rand(-6, 96)}%`, left: `${rand(-6, 100)}%`, delay: `${rand(0, 1.1).toFixed(2)}s` })),
    [spinId],
  );

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (isRetry || reducedMotion || !mounted) return;
    if (celebrated.has(spinId)) return; // nunca repetir
    const canvas = canvasRef.current;
    if (!canvas) return;

    setEffectsOn(true);
    // useWorker: false — o modo estrito do React remonta efeitos e um canvas só pode ser
    // transferido para um worker uma vez.
    const fire = confetti.create(canvas, { resize: true, useWorker: false });
    const colors = [prize.color, ...BRAND];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    // Marca como celebrado só depois que a festa realmente começou (sobrevive ao duplo
    // efeito do modo estrito do React, que monta → desmonta → monta).
    at(60, () => celebrated.add(spinId));

    // Canhões laterais
    const cannons = (count: number, velocity: number) => {
      void fire({ particleCount: count, angle: 60, spread: 58, startVelocity: velocity, origin: { x: 0, y: 0.78 }, colors, zIndex: 101 });
      void fire({ particleCount: count, angle: 120, spread: 58, startVelocity: velocity, origin: { x: 1, y: 0.78 }, colors, zIndex: 101 });
    };
    cannons(90, 62);
    [450, 900, 1400, 1950, 2600, 3300].forEach((ms, i) => at(ms, () => cannons(Math.max(24, 60 - i * 7), 52 - i * 3)));

    // Fogos de artifício: explosões circulares em pontos altos da tela
    for (let ms = 350; ms <= 4300; ms += 560) {
      at(ms, () => {
        const origin = { x: rand(0.15, 0.85), y: rand(0.12, 0.42) };
        void fire({ particleCount: 70, spread: 360, startVelocity: 26, gravity: 0.55, decay: 0.92, ticks: 140, scalar: 0.85, shapes: ['circle'], origin, colors });
        void fire({ particleCount: 18, spread: 360, startVelocity: 14, gravity: 0.4, ticks: 160, scalar: 1.1, shapes: ['star'], origin, colors: ['#FDE047', '#FFFFFF'] });
      });
    }
    // Chuva de estrelas no centro
    at(700, () => void fire({ particleCount: 40, spread: 100, startVelocity: 35, shapes: ['star'], scalar: 1.2, origin: { x: 0.5, y: 0.35 }, colors: ['#FDE047', '#FFFFFF', prize.color] }));

    at(CELEBRATION_EFFECTS_MS, () => setEffectsOn(false));
    return () => {
      timers.forEach(clearTimeout);
      fire.reset();
    };
  }, [spinId, isRetry, reducedMotion, mounted, prize.color]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(styles.theme, styles.overlay, isRetry && styles.overlayLost)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wheel-celebration-title"
      data-testid="wheel-celebration"
      data-effects={effectsOn ? 'on' : 'off'}
      style={viewport ? { left: viewport.left, top: viewport.top, width: viewport.width, height: viewport.height, right: 'auto', bottom: 'auto' } : undefined}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <canvas ref={canvasRef} className={styles.confettiCanvas} aria-hidden="true" />
      {effectsOn &&
        balloons.map((b, i) => (
          <span
            key={i}
            className={styles.balloon}
            data-testid="wheel-balloon"
            aria-hidden="true"
            style={
              {
                left: b.left,
                backgroundColor: b.color,
                borderBottomColor: b.color,
                color: b.color,
                scale: String(b.scale),
                '--delay': b.delay,
                '--dur': b.dur,
                '--sway': b.sway,
              } as React.CSSProperties
            }
          />
        ))}

      <div
        className={cn(styles.celebrationCard, isRetry && styles.cardLost)}
        role="status"
        aria-live="assertive"
        data-testid="wheel-result"
        data-prize-id={prize.id}
      >
        {!isRetry &&
          !reducedMotion &&
          sparkles.map((s, i) => (
            <span key={i} className={styles.sparkle} style={{ top: s.top, left: s.left, animationDelay: s.delay }} aria-hidden="true" />
          ))}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-600 shadow hover:bg-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className="rounded-t-[28px] px-6 pb-14 pt-8 text-center text-white"
          style={{
            background: isRetry ? 'linear-gradient(145deg,#94A3B8,#475569)' : `linear-gradient(145deg, ${prize.color}, #263875)`,
          }}
        >
          <div className="text-[11px] font-black uppercase tracking-[0.3em] opacity-90">
            {isRetry ? 'Não foi dessa vez' : 'Parabéns!'}
          </div>
          <h2 id="wheel-celebration-title" className="mt-1 text-3xl font-black tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {isRetry ? 'Quase lá!' : 'Você ganhou!'}
          </h2>
        </div>
        <div className={styles.trophy} aria-hidden="true">
          {isRetry ? '🍀' : prizeIcon(prize.type)}
        </div>
        <div className="space-y-4 px-6 pb-6 pt-3 text-center">
          <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white break-words" data-testid="wheel-result-label">
            {prize.label}
          </p>
          {!isRetry && prize.type === 'money' && prize.value != null && (
            <div className={cn('rounded-xl py-3', styles.ticket)}>
              <small className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</small>
              <div className={cn('text-3xl font-black', styles.accentText)}>{brl(prize.value)}</div>
            </div>
          )}
          {prize.description && <p className="text-sm text-muted-foreground">{prize.description}</p>}
          <p className="text-sm text-muted-foreground">
            {isRetry ? 'Continue vendendo: cada giro é uma nova chance.' : 'Prêmio registrado. Combine o resgate com o seu gestor.'}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {remainingCredits > 0 && (
              <Button className={cn('h-12 flex-1 font-bold', styles.spinButton)} onClick={onSpinAgain} data-testid="wheel-spin-again">
                <RotateCw className="mr-2 h-4 w-4" /> Girar de novo ({remainingCredits})
              </Button>
            )}
            <Button ref={closeRef} variant="outline" className="h-12 flex-1 font-bold" onClick={onClose} data-testid="wheel-celebration-close">
              Voltar à roleta
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

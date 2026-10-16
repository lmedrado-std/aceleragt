/**
 * Perfil de movimento da Roleta V2.1 (puro, sem DOM).
 *
 * Por que não uma única curva cubic-bezier: a curva herdada da referência
 * (cubic-bezier(.07,.72,.04,1)) fazia a roda percorrer 69% do trajeto no 1º segundo
 * e 99% até 6 s — o giro "parecia" durar 3 s. Aqui o ângulo é calculado quadro a quadro
 * a partir de um perfil de VELOCIDADE em fases:
 *
 *   arranque (smoothstep) → velocidade sustentada → desaceleração longa (1-w)^p
 *   → pequeno recuo final ("settle") que nunca cruza a divisa da fatia.
 *
 * O ângulo final é exatamente `to` (calculado a partir do stopAngleDeg do servidor).
 */

import { indexAtAngle } from './engine';

export const SPIN_TOTAL_MS = 12_000;
export const SPIN_SETTLE_MS = 650;
export const SPIN_TURNS_FULL = 11;
export const REDUCED_TOTAL_MS = 3_000;
export const REDUCED_TURNS = 2;
export const MAX_OVERSHOOT_DEG = 3;

// Fases em fração do tempo principal (sem o recuo).
const ACCEL_END = 0.07; // ~0,8 s de arranque
const SUSTAIN_END = 0.3; // até ~3,4 s em velocidade alta
const DECEL_POWER = 1.5; // cauda longa: 2–3 fatias ainda passam devagar nos 3 s finais

const mod360 = (d: number) => ((d % 360) + 360) % 360;

/** Área acumulada do perfil de velocidade normalizado até u ∈ [0,1]. */
function cumulativeArea(u: number): number {
  const ua = ACCEL_END;
  const uc = SUSTAIN_END;
  const p = DECEL_POWER;
  const a1 = ua * 0.5; // ∫ smoothstep
  const a2 = uc - ua;
  if (u <= 0) return 0;
  if (u <= ua) {
    const x = u / ua;
    return ua * (x * x * x - (x * x * x * x) / 2);
  }
  if (u <= uc) return a1 + (u - ua);
  const w = Math.min(1, (u - uc) / (1 - uc));
  return a1 + a2 + ((1 - uc) / (p + 1)) * (1 - Math.pow(1 - w, p + 1));
}
const TOTAL_AREA = cumulativeArea(1);

/** Velocidade relativa (0–1) no instante u do trecho principal. */
export function relativeSpeed(u: number): number {
  if (u <= 0 || u >= 1) return 0;
  if (u <= ACCEL_END) {
    const x = u / ACCEL_END;
    return x * x * (3 - 2 * x);
  }
  if (u <= SUSTAIN_END) return 1;
  return Math.pow(1 - (u - SUSTAIN_END) / (1 - SUSTAIN_END), DECEL_POWER);
}

/**
 * Quanto a roda pode passar do ponto de parada antes de recuar, sem cruzar a divisa.
 * Girar no sentido positivo leva o ponteiro em direção ao INÍCIO da fatia (index * 360/n).
 */
export function safeOvershoot(count: number, index: number, stopDeg: number, maxDeg = MAX_OVERSHOOT_DEG): number {
  const slice = 360 / count;
  const pointerPos = mod360(-stopDeg);
  const margin = pointerPos - index * slice;
  const delta = Math.min(maxDeg, margin * 0.45);
  return delta > 0.3 ? delta : 0;
}

export interface SpinMotion {
  from: number;
  to: number;
  overshoot: number;
  durationMs: number;
  mainMs: number;
  /** Ângulo absoluto no instante t (ms desde o início da rotação). */
  angleAt(t: number): number;
  /** Velocidade relativa 0–1 no instante t. */
  speedAt(t: number): number;
}

export function createSpinMotion(opts: {
  from: number;
  to: number;
  durationMs: number;
  overshootDeg?: number;
  settleMs?: number;
}): SpinMotion {
  const { from, to, durationMs } = opts;
  const overshoot = Math.max(0, opts.overshootDeg ?? 0);
  const settleMs = overshoot > 0 ? Math.min(opts.settleMs ?? SPIN_SETTLE_MS, durationMs / 4) : 0;
  const mainMs = durationMs - settleMs;
  const peak = to + overshoot;
  const distance = peak - from;

  const angleAt = (t: number) => {
    if (t <= 0) return from;
    if (t >= durationMs) return to;
    if (t <= mainMs) return from + (distance * cumulativeArea(t / mainMs)) / TOTAL_AREA;
    const k = (t - mainMs) / settleMs;
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * k); // ease-in-out
    return peak - overshoot * ease;
  };
  const speedAt = (t: number) => (t > 0 && t < mainMs ? relativeSpeed(t / mainMs) : 0);

  return { from, to, overshoot, durationMs, mainMs, angleAt, speedAt };
}

/** Índice da fatia sob o ponteiro (atalho para o componente). */
export const sliceUnderPointer = (count: number, angle: number) => indexAtAngle(count, angle);

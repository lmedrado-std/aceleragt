import { describe, expect, it } from 'vitest';
import { indexAtAngle, MAX_STOP_JITTER, stopAngleDeg, targetRotation } from '@/lib/wheel/engine';
import {
  createSpinMotion,
  relativeSpeed,
  safeOvershoot,
  SPIN_SETTLE_MS,
  SPIN_TOTAL_MS,
  SPIN_TURNS_FULL,
} from '@/lib/wheel/motion';

const build = (n: number, idx: number, jitter = 0, from = 0) => {
  const stop = stopAngleDeg(n, idx, jitter);
  const to = targetRotation(from, stop, SPIN_TURNS_FULL);
  const overshoot = safeOvershoot(n, idx, stop);
  return { stop, to, overshoot, motion: createSpinMotion({ from, to, durationMs: SPIN_TOTAL_MS, overshootDeg: overshoot }) };
};

describe('perfil de movimento de 12 s', () => {
  it('começa em from, termina EXATAMENTE em to, dura 12 s e dá pelo menos 11 voltas', () => {
    const { to, motion } = build(8, 3);
    expect(motion.angleAt(0)).toBe(0);
    expect(motion.angleAt(SPIN_TOTAL_MS)).toBe(to);
    expect(motion.durationMs).toBe(12_000);
    expect(to).toBeGreaterThanOrEqual(360 * SPIN_TURNS_FULL);
  });

  it('não é "tudo no começo": ~45% em 3 s, ~85% em 6 s e as últimas fatias ainda passam nos 3 s finais', () => {
    const { motion } = build(8, 0, 0.2);
    const total = motion.to - motion.from;
    const frac = (t: number) => (motion.angleAt(t) - motion.from) / total;
    expect(frac(1000)).toBeLessThan(0.15);
    expect(frac(3000)).toBeGreaterThan(0.35);
    expect(frac(3000)).toBeLessThan(0.6);
    expect(frac(6000)).toBeGreaterThan(0.75);
    expect(frac(6000)).toBeLessThan(0.92);
    // nos últimos 3 s ainda passa pelo menos uma fatia inteira (suspense visível)
    expect(motion.angleAt(motion.mainMs) - motion.angleAt(9000)).toBeGreaterThan(80);
  });

  it('é monotônico até o pico e o recuo final é pequeno', () => {
    const { motion } = build(10, 7, 0.3);
    let prev = -Infinity;
    for (let t = 0; t <= motion.mainMs; t += 5) {
      const a = motion.angleAt(t);
      expect(a).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = a;
    }
    expect(motion.overshoot).toBeLessThanOrEqual(3);
  });

  it('velocidade relativa: sobe, sustenta e cai até zero', () => {
    expect(relativeSpeed(0)).toBe(0);
    expect(relativeSpeed(0.2)).toBe(1);
    expect(relativeSpeed(0.6)).toBeGreaterThan(0);
    expect(relativeSpeed(0.6)).toBeLessThan(0.5);
    expect(relativeSpeed(1)).toBe(0);
  });

  it('para n = 2…12, todo índice e deslocamento extremo: o pico do recuo e a parada ficam na fatia sorteada', () => {
    for (let n = 2; n <= 12; n++) {
      for (let i = 0; i < n; i++) {
        for (const j of [-MAX_STOP_JITTER, -0.2, 0, 0.2, MAX_STOP_JITTER]) {
          for (const from of [0, 4321.5]) {
            const { to, overshoot, motion } = build(n, i, j, from);
            expect(indexAtAngle(n, motion.angleAt(SPIN_TOTAL_MS))).toBe(i);
            expect(indexAtAngle(n, to + overshoot)).toBe(i);
            // durante todo o recuo o ponteiro continua na fatia sorteada
            for (let t = motion.mainMs; t <= SPIN_TOTAL_MS; t += SPIN_SETTLE_MS / 10) {
              expect(indexAtAngle(n, motion.angleAt(t))).toBe(i);
            }
          }
        }
      }
    }
  });

  it('sem recuo quando a parada já está colada na divisa', () => {
    // jitter negativo máximo aproxima a parada do fim da fatia; positivo, do início
    const n = 8;
    const stop = stopAngleDeg(n, 2, MAX_STOP_JITTER);
    const d = safeOvershoot(n, 2, stop);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(indexAtAngle(n, stop + d)).toBe(2);
  });
});

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHT,
  MAX_STOP_JITTER,
  buildWheelSnapshot,
  indexAtAngle,
  normalizeWeight,
  pickWeightedIndex,
  probabilities,
  readableTextColor,
  stopAngleDeg,
  targetRotation,
  wheelLabelLines,
  type SegmentRecord,
} from '@/lib/wheel/engine';

const seg = (over: Partial<SegmentRecord>): SegmentRecord => ({
  id: 'x',
  label: 'Prêmio',
  type: 'money',
  value: 10,
  color: '#123456',
  weight: 10,
  position: 0,
  is_active: true,
  ...over,
});

describe('normalizeWeight', () => {
  it('nulo/indefinido vale o default da coluna (10), igual à tela de configuração', () => {
    expect(normalizeWeight(null)).toBe(DEFAULT_WEIGHT);
    expect(normalizeWeight(undefined)).toBe(DEFAULT_WEIGHT);
  });
  it('negativo e inválido valem 0; decimal é truncado', () => {
    expect(normalizeWeight(-5)).toBe(0);
    expect(normalizeWeight('abc')).toBe(0);
    expect(normalizeWeight(7.9)).toBe(7);
    expect(normalizeWeight(0)).toBe(0);
  });
});

describe('pickWeightedIndex — prova exaustiva das probabilidades', () => {
  const cases: number[][] = [
    [1, 1],
    [10, 10, 10],
    [38, 27, 20, 14, 10, 8, 5, 3],
    [1, 0, 3, 0, 6],
    [1000, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];
  for (const weights of cases) {
    it(`cada fatia sai exatamente "peso" vezes em todos os valores possíveis do RNG: [${weights.join(', ')}]`, () => {
      const total = weights.reduce((a, b) => a + b, 0);
      const counts = new Array(weights.length).fill(0);
      for (let r = 0; r < total; r++) counts[pickWeightedIndex(weights, () => r)]++;
      expect(counts).toEqual(weights);
    });
  }

  it('peso nulo participa com peso 10', () => {
    const counts = [0, 0];
    for (let r = 0; r < 20; r++) counts[pickWeightedIndex([null as unknown as number, 10], () => r)]++;
    expect(counts).toEqual([10, 10]);
  });

  it('todos os pesos zero geram erro (nunca escolhe uma fatia arbitrária)', () => {
    expect(() => pickWeightedIndex([0, 0], () => 0)).toThrow('NO_DRAWABLE_SEGMENTS');
  });

  it('RNG fora do intervalo é rejeitado', () => {
    expect(() => pickWeightedIndex([1, 1], () => 2)).toThrow('INVALID_RANDOM');
    expect(() => pickWeightedIndex([1, 1], () => -1)).toThrow('INVALID_RANDOM');
  });
});

describe('geometria da roda', () => {
  it('para n = 2…12, todo índice volta a si mesmo, com voltas extras e com deslocamento dentro da fatia', () => {
    for (let n = 2; n <= 12; n++) {
      for (let i = 0; i < n; i++) {
        for (const jitter of [0, MAX_STOP_JITTER, -MAX_STOP_JITTER, 0.2, -0.1]) {
          const stop = stopAngleDeg(n, i, jitter);
          expect(stop).toBeGreaterThanOrEqual(0);
          expect(stop).toBeLessThan(360);
          for (const from of [0, 17.3, 359.9, 7200, 12345.6]) {
            for (const turns of [0, 1, 8]) {
              const to = targetRotation(from, stop, turns);
              expect(to).toBeGreaterThanOrEqual(from + 360 * turns);
              expect(to - from).toBeLessThan(360 * (turns + 1));
              expect(indexAtAngle(n, to)).toBe(i);
            }
          }
        }
      }
    }
  });

  it('o deslocamento é limitado a ±35% da fatia (nunca encosta na divisa)', () => {
    const n = 8;
    const center = stopAngleDeg(n, 3, 0);
    const extreme = stopAngleDeg(n, 3, 5);
    expect(Math.abs(center - extreme)).toBeCloseTo(0.35 * (360 / n), 6);
  });

  it('valida parâmetros', () => {
    expect(() => stopAngleDeg(0, 0)).toThrow();
    expect(() => stopAngleDeg(4, 4)).toThrow();
    expect(() => stopAngleDeg(4, -1)).toThrow();
  });
});

describe('buildWheelSnapshot', () => {
  it('mantém só fatias ativas com peso > 0, na ordem de posição', () => {
    const snap = buildWheelSnapshot([
      seg({ id: 'c', position: 2 }),
      seg({ id: 'a', position: 0, weight: null }),
      seg({ id: 'off', position: 1, is_active: false }),
      seg({ id: 'zero', position: 3, weight: 0 }),
      seg({ id: 'nul', position: 4, is_active: null }),
      seg({ id: 'b', position: 1 }),
    ]);
    expect(snap.map((s) => s.id)).toEqual(['a', 'b', 'c', 'nul']);
    expect(snap[0].weight).toBe(10);
  });

  it('cor inválida vira a cor padrão e o valor vira número', () => {
    const [s] = buildWheelSnapshot([seg({ color: 'red', value: '12.5' as unknown as number })]);
    expect(s.color).toBe('#3B82F6');
    expect(s.value).toBe(12.5);
  });
});

describe('apresentação', () => {
  it('probabilidades em %', () => {
    const p = probabilities([1, 3]);
    expect(p[0]).toBeCloseTo(25);
    expect(p[1]).toBeCloseTo(75);
  });
  it('contraste do texto', () => {
    expect(readableTextColor('#000000')).toBe('#FFFFFF');
    expect(readableTextColor('#FFFFFF')).toBe('#0F172A');
    expect(readableTextColor('#005A73')).toBe('#FFFFFF');
    expect(readableTextColor('#FDE047')).toBe('#0F172A');
  });
  it('rótulo em no máximo 2 linhas curtas', () => {
    expect(wheelLabelLines('R$ 50')).toEqual(['R$ 50']);
    expect(wheelLabelLines('Vale compras de cinquenta reais')).toHaveLength(2);
    for (const line of wheelLabelLines('Um nome de prêmio muito comprido mesmo para a roda')) {
      expect(line.length).toBeLessThanOrEqual(12);
    }
  });
});

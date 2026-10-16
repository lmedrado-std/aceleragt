/**
 * Motor puro da Roleta V2 (sem React e sem Prisma).
 *
 * Usado pelo servidor (sorteio), pelo navegador (animação) e pelos testes.
 * Geometria: 0° fica no ponteiro (topo) e os ângulos crescem no sentido horário.
 * A fatia i ocupa o intervalo [i * 360/n, (i + 1) * 360/n).
 */

export const DEFAULT_WEIGHT = 10; // mesmo default da coluna prize_wheel_segments.weight
export const MIN_ACTIVE_SEGMENTS = 2;
export const MAX_ACTIVE_SEGMENTS = 12;
export const MAX_WEIGHT = 1000;
export const DEFAULT_SEGMENT_COLOR = '#3B82F6';
export const SEGMENT_TYPES = ['money', 'voucher', 'product', 'retry'] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

/** Fração máxima (para cada lado) que o ponto de parada pode se afastar do centro da fatia. */
export const MAX_STOP_JITTER = 0.35;

export interface SegmentRecord {
  id: string;
  label: string;
  type: string;
  value: number | null;
  description?: string | null;
  color?: string | null;
  weight: number | null;
  position: number;
  is_active: boolean | null;
}

/** Fatia como ela é desenhada na roda e devolvida ao navegador. */
export interface WheelSlice {
  id: string;
  label: string;
  type: string;
  value: number | null;
  description: string | null;
  color: string;
  weight: number;
}

/** Peso efetivo: nulo vale o default da coluna (10); negativo ou inválido vale 0. */
export function normalizeWeight(weight: unknown): number {
  if (weight === null || weight === undefined || weight === '') return DEFAULT_WEIGHT;
  const n = Number(weight);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

/** is_active nulo é tratado como ativo (é o que a tela de configuração sempre mostrou). */
export function isSegmentActive(segment: Pick<SegmentRecord, 'is_active'>): boolean {
  return segment.is_active !== false;
}

export function normalizeColor(color: unknown): string {
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_SEGMENT_COLOR;
}

/**
 * Fatias que aparecem na roda e podem ser sorteadas: ativas, com peso > 0,
 * em ordem de posição (empate desfeito pelo id para ficar determinístico).
 */
export function buildWheelSnapshot(segments: SegmentRecord[]): WheelSlice[] {
  return segments
    .filter((s) => isSegmentActive(s) && normalizeWeight(s.weight) > 0)
    .slice()
    .sort((a, b) => a.position - b.position || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((s) => ({
      id: String(s.id),
      label: String(s.label ?? ''),
      type: String(s.type ?? ''),
      value: s.value === null || s.value === undefined ? null : Number(s.value),
      description: s.description ?? null,
      color: normalizeColor(s.color),
      weight: normalizeWeight(s.weight),
    }));
}

/**
 * Sorteio proporcional ao peso.
 * `randomInt(max)` deve devolver um inteiro uniforme em [0, max) — no servidor é crypto.randomInt.
 * Cada fatia i é escolhida para exatamente weights[i] dos `total` valores possíveis.
 */
export function pickWeightedIndex(weights: number[], randomInt: (max: number) => number): number {
  const clean = weights.map(normalizeWeight);
  const total = clean.reduce((sum, w) => sum + w, 0);
  if (total <= 0) throw new Error('NO_DRAWABLE_SEGMENTS');
  const r = randomInt(total);
  if (!Number.isInteger(r) || r < 0 || r >= total) throw new Error('INVALID_RANDOM');
  let acc = 0;
  for (let i = 0; i < clean.length; i++) {
    acc += clean[i];
    if (r < acc) return i;
  }
  /* istanbul ignore next — inalcançável com r < total */
  throw new Error('INVALID_RANDOM');
}

const mod360 = (deg: number) => ((deg % 360) + 360) % 360;

/**
 * Rotação final (0–360°) que deixa o ponto `center + jitter` da fatia `index` sob o ponteiro.
 * `jitter` é uma fração da largura da fatia, limitada a ±MAX_STOP_JITTER.
 */
export function stopAngleDeg(count: number, index: number, jitter = 0): number {
  if (!Number.isInteger(count) || count < 1) throw new Error('INVALID_COUNT');
  if (!Number.isInteger(index) || index < 0 || index >= count) throw new Error('INVALID_INDEX');
  const j = Math.max(-MAX_STOP_JITTER, Math.min(MAX_STOP_JITTER, Number(jitter) || 0));
  const slice = 360 / count;
  return mod360(360 - (index + 0.5 + j) * slice);
}

/** Índice da fatia que está sob o ponteiro quando a roda está girada `rotationDeg` graus. */
export function indexAtAngle(count: number, rotationDeg: number): number {
  const slice = 360 / count;
  const underPointer = mod360(-rotationDeg);
  return Math.min(count - 1, Math.floor(underPointer / slice));
}

/**
 * Rotação absoluta final da animação: parte de `fromDeg`, dá `turns` voltas completas
 * e termina exatamente em `stopDeg` (módulo 360).
 */
export function targetRotation(fromDeg: number, stopDeg: number, turns: number): number {
  const delta = mod360(stopDeg - mod360(fromDeg));
  return fromDeg + 360 * turns + delta;
}

/** Chance de cada fatia em %, na mesma ordem. */
export function probabilities(weights: number[]): number[] {
  const clean = weights.map(normalizeWeight);
  const total = clean.reduce((s, w) => s + w, 0);
  return clean.map((w) => (total > 0 ? (w / total) * 100 : 0));
}

/** Cor de texto legível sobre a cor da fatia (contraste WCAG simples). */
export function readableTextColor(hex: string): '#FFFFFF' | '#0F172A' {
  const c = normalizeColor(hex).slice(1);
  const ch = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const lin = ch.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  const contrastWhite = 1.05 / (lum + 0.05);
  const contrastDark = (lum + 0.05) / (0.0137 + 0.05);
  return contrastWhite >= contrastDark ? '#FFFFFF' : '#0F172A';
}

/** Quebra o rótulo em no máximo 2 linhas curtas para caber na fatia. */
export function wheelLabelLines(label: string, maxPerLine = 12): string[] {
  const text = String(label || '').trim().replace(/\s+/g, ' ').toUpperCase();
  if (text.length <= maxPerLine) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxPerLine || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  const clip = (s: string) => (s.length > maxPerLine ? `${s.slice(0, maxPerLine - 1)}…` : s);
  if (lines.length <= 2) return lines.map(clip);
  // Mais de 2 linhas: a segunda linha recebe o restante e termina com reticências.
  const rest = lines.slice(1).join(' ');
  return [clip(lines[0]), `${rest.slice(0, maxPerLine - 1)}…`];
}

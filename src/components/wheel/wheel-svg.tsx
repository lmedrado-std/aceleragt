'use client';

import { forwardRef } from 'react';
import { Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { readableTextColor, wheelLabelLines } from '@/lib/wheel/engine';
import styles from './prize-wheel.module.css';

export interface WheelSvgSlice {
  id: string;
  label: string;
  type: string;
  color: string;
}

export const PRIZE_ICONS: Record<string, string> = {
  money: '💰',
  voucher: '⭐',
  product: '🎁',
  retry: '🔁',
};
export const prizeIcon = (type: string) => PRIZE_ICONS[type] ?? '🎯';

// Mesma geometria das roletas de referência (Supermoda v1.6 / Óticas Alves v7.3):
// viewBox 500×500, centro (250,250), raio 238, 0° no topo, sentido horário.
const C = 250;
const R = 238;
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};
const wedgePath = (i: number, n: number) => {
  if (n === 1) return `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`;
  const a = (i * 360) / n;
  const b = ((i + 1) * 360) / n;
  const s = polar(R, a);
  const e = polar(R, b);
  const large = b - a > 180 ? 1 : 0;
  return `M${C} ${C} L${s.x} ${s.y} A${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
};

/** Até 8 fatias: texto horizontal (como nas referências). De 9 a 12: texto radial, que cabe nas fatias estreitas. */
const RADIAL_FROM = 9;

function SliceLabel({ slice, index, count }: { slice: WheelSvgSlice; index: number; count: number }) {
  const fill = readableTextColor(slice.color);
  const outline = fill === '#FFFFFF' ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.75)';
  const mid = ((index + 0.5) * 360) / count;

  if (count >= RADIAL_FROM) {
    const lines = wheelLabelLines(slice.label, 13);
    const p = polar(150, mid);
    const icon = polar(212, mid);
    return (
      <g className={styles.sliceLabel}>
        <g transform={`translate(${p.x} ${p.y}) rotate(${mid - 90})`}>
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={15}
            fontWeight={900}
            fill={fill}
            stroke={outline}
            strokeWidth={0.6}
            paintOrder="stroke"
          >
            {lines.map((line, j) => (
              <tspan key={j} x={0} dy={j === 0 ? (lines.length > 1 ? -8 : 0) : 17}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
        <text x={icon.x} y={icon.y} textAnchor="middle" dominantBaseline="middle" fontSize={18}>
          {prizeIcon(slice.type)}
        </text>
      </g>
    );
  }

  const lines = wheelLabelLines(slice.label, count <= 5 ? 12 : 11);
  const longest = Math.max(...lines.map((l) => l.length));
  const base = count <= 5 ? 19 : 16;
  const fontSize = Math.max(12, Math.min(base, (base * 10) / Math.max(10, longest)));
  const p = polar(count <= 5 ? 168 : 174, mid);
  const twoLines = lines.length > 1;
  return (
    <g transform={`translate(${p.x} ${p.y})`} className={styles.sliceLabel}>
      <text
        textAnchor="middle"
        y={twoLines ? -11 : -2}
        fontSize={fontSize}
        fontWeight={900}
        fill={fill}
        stroke={outline}
        strokeWidth={0.7}
        paintOrder="stroke"
      >
        {lines.map((line, j) => (
          <tspan key={j} x={0} dy={j ? fontSize + 2 : 0}>
            {line}
          </tspan>
        ))}
      </text>
      <text textAnchor="middle" y={twoLines ? 35 : 25} fontSize={22}>
        {prizeIcon(slice.type)}
      </text>
    </g>
  );
}

interface WheelSvgProps {
  slices: WheelSvgSlice[];
  className?: string;
  /** Tamanho compacto (preview do gestor). */
  compact?: boolean;
  ariaLabel?: string;
}

/**
 * Roda SVG. O `ref` aponta para o grupo que gira (rotor); ponteiro e cubo ficam fixos.
 * Cada fatia leva `data-segment-id` e `data-index` para conferência nos testes.
 */
export const WheelSvg = forwardRef<SVGGElement, WheelSvgProps>(function WheelSvg(
  { slices, className, compact, ariaLabel = 'Roleta de prêmios' },
  rotorRef,
) {
  const n = Math.max(slices.length, 1);
  return (
    <div className={cn(styles.shell, compact && styles.shellCompact, className)}>
      <div className={styles.pointer} aria-hidden="true" />
      <svg className={styles.svg} viewBox="0 0 500 500" role="img" aria-label={ariaLabel}>
        <g ref={rotorRef} className={styles.rotor} data-testid="wheel-rotor">
          {slices.length === 0 ? (
            <circle cx={C} cy={C} r={R} fill="#E2E8F0" />
          ) : (
            slices.map((slice, i) => (
              <g key={`${slice.id}-${i}`} data-segment-id={slice.id} data-index={i}>
                <path d={wedgePath(i, n)} fill={slice.color} stroke="#FFFFFF" strokeWidth={2} />
                <SliceLabel slice={slice} index={i} count={n} />
              </g>
            ))
          )}
          <circle cx={C} cy={C} r={R} fill="none" className={styles.outerRing} strokeWidth={13} />
          <circle cx={C} cy={C} r={226} fill="none" stroke="#FFFFFF" strokeWidth={4} />
        </g>
      </svg>
      <div className={styles.hub} aria-hidden="true">
        <Rocket className={styles.hubIcon} />
        <span className={styles.hubText}>GT</span>
      </div>
    </div>
  );
});

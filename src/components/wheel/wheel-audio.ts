'use client';

/**
 * Áudio da Roleta V2.1 — 100% sintetizado (Web Audio), sem arquivos e sem bibliotecas.
 * As roletas de referência (Supermoda/Óticas Alves) também sintetizam o som; não há
 * arquivos de áudio nelas para reaproveitar.
 *
 * Regras:
 * - um único AudioContext, criado/retomado SOMENTE dentro de um gesto do usuário (unlockAudio);
 * - tudo passa por um ganho mestre: silenciar zera o mestre na hora, inclusive no meio do giro;
 * - cada fonte criada é registrada e pode ser encerrada (stopAllSounds) para nunca acumular sons
 *   entre giros consecutivos;
 * - qualquer falha de áudio é engolida: som nunca quebra a roleta.
 */

const STORAGE_KEY = 'aceleragt.roleta.som';

type SoundKind = 'start' | 'tick' | 'drumroll' | 'stop' | 'fanfare' | 'retry';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let noiseBuffer: AudioBuffer | null = null;
let lastTickAt = 0;
const active = new Set<AudioScheduledSourceNode>();
const counts: Record<SoundKind, number> = { start: 0, tick: 0, drumroll: 0, stop: 0, fanfare: 0, retry: 0 };

// Ganchos de diagnóstico usados pelos testes ponta a ponta (sem efeito no comportamento).
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__aceleraWheelAudio = {
    counts,
    active: () => active.size,
    state: () => ctx?.state ?? 'none',
    muted: () => muted,
  };
}

export function readMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
}

export function saveMutedPreference(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'off' : 'on');
  } catch {
    /* modo privado / armazenamento bloqueado: a preferência vale só nesta tela */
  }
}

export function setAudioMuted(value: boolean) {
  muted = value;
  try {
    if (master && ctx) master.gain.setTargetAtTime(value ? 0 : 1, ctx.currentTime, 0.02);
  } catch {
    /* ignora */
  }
  if (value) stopAllSounds();
}

/** Precisa ser chamado dentro do handler de um clique/toque. */
export function unlockAudio() {
  if (muted) return;
  try {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return;
    if (!ctx) {
      ctx = new A();
      master = ctx.createGain();
      master.gain.value = 1;
      // limitador suave para nunca distorcer quando várias vozes somam
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.ratio.value = 6;
      master.connect(comp);
      comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
    master = null;
  }
}

function ready(): AudioContext | null {
  if (muted || !ctx || !master || ctx.state !== 'running') return null;
  return ctx;
}

function track<T extends AudioScheduledSourceNode>(node: T): T {
  active.add(node);
  node.onended = () => {
    active.delete(node);
    try {
      node.disconnect();
    } catch {
      /* ignora */
    }
  };
  return node;
}

function getNoise(a: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === a.sampleRate) return noiseBuffer;
  const length = a.sampleRate * 2;
  noiseBuffer = a.createBuffer(1, length, a.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function noiseBurst(a: AudioContext, at: number, opts: { duration: number; freq: number; q: number; gain: number; type?: BiquadFilterType }) {
  const src = track(a.createBufferSource());
  src.buffer = getNoise(a);
  const filter = a.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const g = a.createGain();
  g.gain.setValueAtTime(opts.gain, at);
  g.gain.exponentialRampToValueAtTime(0.001, at + opts.duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(master!);
  src.start(at, Math.random() * 1.5);
  src.stop(at + opts.duration + 0.02);
}

function tone(a: AudioContext, at: number, opts: { freq: number; duration: number; gain: number; type?: OscillatorType; slideTo?: number; attack?: number }) {
  const o = track(a.createOscillator());
  o.type = opts.type ?? 'triangle';
  o.frequency.setValueAtTime(opts.freq, at);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, at + opts.duration);
  const g = a.createGain();
  const attack = opts.attack ?? 0.01;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(opts.gain, at + attack);
  g.gain.exponentialRampToValueAtTime(0.001, at + opts.duration);
  o.connect(g);
  g.connect(master!);
  o.start(at);
  o.stop(at + opts.duration + 0.05);
  return o;
}

/** Encerra todas as fontes em andamento (antes de um novo giro, ao silenciar, ao sair da tela). */
export function stopAllSounds() {
  for (const node of Array.from(active)) {
    try {
      node.stop();
    } catch {
      /* já parado */
    }
    active.delete(node);
  }
}

export interface SpinSoundController {
  /** Atualiza a intensidade do "rolamento" (0–1), chamado a cada quadro. */
  setSpeed(speed: number): void;
  /** Encerra rolamento e suspense com fade curto. */
  stop(): void;
}

const NOOP_CONTROLLER: SpinSoundController = { setSpeed: () => {}, stop: () => {} };

/**
 * Som de início + rolamento contínuo (intensidade segue a velocidade) + trilha de suspense
 * crescente + rufar de tambor acelerando nos últimos segundos.
 */
export function startSpinSound(durationMs: number): SpinSoundController {
  const a = ready();
  if (!a) return NOOP_CONTROLLER;
  try {
    const now = a.currentTime;
    const seconds = durationMs / 1000;

    // 1) arranque: "whoosh" com filtro varrendo para cima
    const w = track(a.createBufferSource());
    w.buffer = getNoise(a);
    const wf = a.createBiquadFilter();
    wf.type = 'bandpass';
    wf.Q.value = 1.2;
    wf.frequency.setValueAtTime(300, now);
    wf.frequency.exponentialRampToValueAtTime(3200, now + 0.55);
    const wg = a.createGain();
    wg.gain.setValueAtTime(0.0001, now);
    wg.gain.linearRampToValueAtTime(0.35, now + 0.12);
    wg.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    w.connect(wf);
    wf.connect(wg);
    wg.connect(master!);
    w.start(now);
    w.stop(now + 0.75);
    counts.start++;

    // 2) rolamento: ruído grave contínuo cuja intensidade acompanha a velocidade
    const bus = a.createGain();
    bus.gain.value = 1;
    bus.connect(master!);
    const roll = track(a.createBufferSource());
    roll.buffer = getNoise(a);
    roll.loop = true;
    const rf = a.createBiquadFilter();
    rf.type = 'lowpass';
    rf.frequency.value = 400;
    const rg = a.createGain();
    rg.gain.value = 0.0001;
    roll.connect(rf);
    rf.connect(rg);
    rg.connect(bus);
    roll.start(now);

    // 3) suspense: acorde que sobe de tom e de volume durante o giro
    [98, 146.83, 196, 293.66].forEach((f, i) => {
      const o = track(a.createOscillator());
      o.type = i % 2 === 0 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, now);
      o.frequency.exponentialRampToValueAtTime(f * 1.5, now + seconds * 0.95);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.012, now + 1.5);
      g.gain.linearRampToValueAtTime(0.05, now + seconds * 0.88);
      g.gain.exponentialRampToValueAtTime(0.0005, now + seconds);
      o.connect(g);
      g.connect(bus);
      o.start(now);
      o.stop(now + seconds + 0.1);
    });

    // 4) rufar de tambor nos ~3 s finais, acelerando e crescendo até a parada
    const rollStart = now + Math.max(0, seconds - 3.2);
    const rollEnd = now + seconds - 0.15;
    let t = rollStart;
    let interval = 0.13;
    let n = 0;
    while (t < rollEnd) {
      const progress = (t - rollStart) / (rollEnd - rollStart);
      noiseBurst(a, t, { duration: 0.06, freq: 1800 + 900 * progress, q: 0.9, gain: 0.05 + 0.16 * progress });
      t += interval;
      interval = Math.max(0.035, interval * 0.93);
      n++;
    }
    if (n > 0) counts.drumroll++;

    let stopped = false;
    return {
      setSpeed(speed: number) {
        if (stopped || !ctx) return;
        const s = Math.max(0, Math.min(1, speed));
        const t0 = ctx.currentTime;
        rg.gain.setTargetAtTime(0.012 + 0.07 * s, t0, 0.08);
        rf.frequency.setTargetAtTime(260 + 1500 * s, t0, 0.08);
      },
      stop() {
        if (stopped || !ctx) return;
        stopped = true;
        const t0 = ctx.currentTime;
        try {
          bus.gain.setTargetAtTime(0.0001, t0, 0.06);
          roll.stop(t0 + 0.4);
        } catch {
          /* ignora */
        }
      },
    };
  } catch {
    return NOOP_CONTROLLER;
  }
}

/** "Tic" de catraca quando uma divisa passa pelo ponteiro. Mais grave e mais forte quando lento. */
export function playTick(speed: number) {
  const a = ready();
  if (!a) return;
  const nowMs = performance.now();
  if (nowMs - lastTickAt < 22) return; // em alta velocidade, no máximo ~45 tics/s
  lastTickAt = nowMs;
  try {
    const at = a.currentTime;
    const s = Math.max(0, Math.min(1, speed));
    noiseBurst(a, at, {
      duration: 0.012 + 0.02 * (1 - s),
      freq: 2600 + 1800 * s + Math.random() * 400,
      q: 3,
      gain: 0.22 + 0.25 * (1 - s),
    });
    tone(a, at, { freq: 900 + 700 * s, duration: 0.03, gain: 0.05 + 0.06 * (1 - s), type: 'square', attack: 0.002 });
    counts.tick++;
  } catch {
    /* ignora */
  }
}

/** Batida seca no instante em que a roda para. */
export function playStop() {
  const a = ready();
  if (!a) return;
  try {
    const at = a.currentTime;
    tone(a, at, { freq: 150, slideTo: 55, duration: 0.35, gain: 0.32, type: 'sine', attack: 0.004 });
    noiseBurst(a, at, { duration: 0.12, freq: 900, q: 0.7, gain: 0.18, type: 'lowpass' });
    counts.stop++;
  } catch {
    /* ignora */
  }
}

/** Fanfarra de vitória (~2 s): arpejo de metais + acorde final + brilho agudo. */
export function playFanfare() {
  const a = ready();
  if (!a) return;
  try {
    const at = a.currentTime + 0.05;
    const brass = (freq: number, start: number, dur: number, gain: number) => {
      const o = track(a.createOscillator());
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, at + start);
      const lfo = track(a.createOscillator());
      lfo.frequency.value = 5.5;
      const lfoGain = a.createGain();
      lfoGain.gain.value = freq * 0.006;
      lfo.connect(lfoGain);
      lfoGain.connect(o.frequency);
      const f = a.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, at + start);
      f.frequency.linearRampToValueAtTime(2600, at + start + 0.08);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, at + start);
      g.gain.linearRampToValueAtTime(gain, at + start + 0.03);
      g.gain.setValueAtTime(gain, at + start + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, at + start + dur);
      o.connect(f);
      f.connect(g);
      g.connect(master!);
      o.start(at + start);
      o.stop(at + start + dur + 0.05);
      lfo.start(at + start);
      lfo.stop(at + start + dur + 0.05);
    };
    // ta-ta-ta-TAAA
    brass(523.25, 0, 0.16, 0.09);
    brass(659.25, 0.17, 0.16, 0.09);
    brass(783.99, 0.34, 0.16, 0.09);
    brass(1046.5, 0.52, 1.3, 0.1);
    // acorde de apoio
    [523.25, 659.25, 783.99].forEach((f) => brass(f, 0.52, 1.3, 0.05));
    // brilho
    [2093, 2637, 3136, 4186].forEach((f, i) => tone(a, at + 0.6 + i * 0.09, { freq: f, duration: 0.5, gain: 0.03, type: 'sine' }));
    counts.fanfare++;
  } catch {
    /* ignora */
  }
}

/** Resultado sem prêmio: "uóóó" suave, sem fanfarra. */
export function playRetry() {
  const a = ready();
  if (!a) return;
  try {
    const at = a.currentTime + 0.05;
    tone(a, at, { freq: 392, slideTo: 370, duration: 0.35, gain: 0.07, type: 'sine', attack: 0.03 });
    tone(a, at + 0.38, { freq: 349, slideTo: 262, duration: 0.7, gain: 0.07, type: 'sine', attack: 0.03 });
    counts.retry++;
  } catch {
    /* ignora */
  }
}

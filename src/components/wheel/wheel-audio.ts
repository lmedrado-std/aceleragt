'use client';

/**
 * Sons da roleta (Web Audio, sem arquivos).
 * Navegadores só liberam áudio depois de um gesto do usuário: `unlockAudio()` precisa
 * ser chamado dentro do handler do clique. Se o áudio estiver mudo ou bloqueado,
 * todas as funções viram no-op.
 */

const STORAGE_KEY = 'aceleragt.roleta.som';

let ctx: AudioContext | null = null;

export function readMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
}

export function saveMutedPreference(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? 'off' : 'on');
  } catch {
    /* modo privado / armazenamento bloqueado: a preferência vale só nesta tela */
  }
}

export function unlockAudio() {
  try {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return;
    if (!ctx) ctx = new A();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq: number, duration = 0.04, volume = 0.035, type: OscillatorType = 'triangle') {
  try {
    const a = ctx;
    if (!a || a.state !== 'running') return;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(volume, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + duration);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + duration);
  } catch {
    /* ignora */
  }
}

export function playTick() {
  tone(820, 0.025, 0.025);
}

/** Suspense crescente com a duração do giro. Devolve a função que o interrompe. */
export function startSuspense(durationMs: number): () => void {
  try {
    const a = ctx;
    if (!a || a.state !== 'running') return () => {};
    const seconds = durationMs / 1000;
    const master = a.createGain();
    master.gain.value = 0.035;
    master.connect(a.destination);
    const start = a.currentTime;
    [98, 146.8, 196].forEach((f, i) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, start);
      o.frequency.exponentialRampToValueAtTime(f * 1.7, start + seconds * 0.98);
      g.gain.setValueAtTime(0.012, start);
      g.gain.linearRampToValueAtTime(0.06, start + seconds * 0.9);
      g.gain.linearRampToValueAtTime(0.0001, start + seconds * 0.99);
      o.connect(g);
      g.connect(master);
      o.start(start);
      o.stop(start + seconds);
    });
    return () => {
      try {
        master.gain.setTargetAtTime(0.0001, a.currentTime, 0.03);
      } catch {
        /* ignora */
      }
    };
  } catch {
    return () => {};
  }
}

export function playWin() {
  [659, 784, 988].forEach((f, i) => setTimeout(() => tone(f, 0.28, 0.075), i * 120));
}

export function playRetry() {
  [440, 349].forEach((f, i) => setTimeout(() => tone(f, 0.22, 0.05, 'sine'), i * 160));
}

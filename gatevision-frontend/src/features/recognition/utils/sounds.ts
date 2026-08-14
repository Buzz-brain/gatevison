export type GateSound = "open" | "deny" | "beep";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") void audioCtx.resume().catch(() => undefined);
    return audioCtx;
  } catch {
    return null;
  }
}

export function primeAudio(): void {
  try {
    const c = getCtx();
    if (c && c.state === "suspended") void c.resume();
  } catch {
    /* audio unavailable - ignore */
  }
}

function tone(
  c: AudioContext,
  start: number,
  dur: number,
  freqStart: number,
  freqEnd: number,
  type: OscillatorType,
  vol: number,
  dest: GainNode,
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  }
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.03);
  g.gain.setValueAtTime(vol, start + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playGateSound(kind: GateSound): void {
  try {
    const c = getCtx();
    if (!c) return;
    const now = c.currentTime;
    const master = c.createGain();
    master.connect(c.destination);
    master.gain.setValueAtTime(0.9, now);

    if (kind === "open") {
      tone(c, now, 0.14, 950, 620, "sine", 0.3, master);
      tone(c, now + 0.2, 1.1, 175, 85, "triangle", 0.4, master);
      tone(c, now + 0.3, 1.0, 140, 65, "sine", 0.26, master);
      tone(c, now + 1.4, 0.2, 75, 50, "sine", 0.5, master);
      tone(c, now + 1.6, 0.36, 659, 659, "sine", 0.22, master);
      tone(c, now + 2.0, 0.6, 880, 880, "sine", 0.24, master);
    } else if (kind === "deny") {
      tone(c, now, 0.9, 120, 90, "square", 0.2, master);
      tone(c, now + 0.35, 0.55, 95, 70, "square", 0.16, master);
    } else if (kind === "beep") {
      tone(c, now, 0.12, 740, 740, "sine", 0.14, master);
    }
  } catch {
    /* audio unavailable - ignore */
  }
}

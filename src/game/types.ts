export type Phase = "ready" | "playing" | "paused" | "dying" | "dead";

export interface Bird {
  x: number;
  y: number;
  vy: number;
  rot: number;
  wingPhase: number;
  stretch: number; // >1 stretched vertically (on flap)
  flapBoost: number; // wing burst 1 -> 0
}

export interface Pipe {
  id: number;
  x: number;
  gapY: number;
  gapH: number;
  scored: boolean;
}

export type ParticleKind =
  | "puff"
  | "spark"
  | "debris"
  | "dust"
  | "feather"
  | "popup";

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  sizeEnd: number;
  rot: number;
  vr: number;
  color: string;
  gravity: number;
  drag: number;
  sway: number;
  phase: number;
  text?: string;
}

export interface Cloud {
  x: number;
  y: number;
  scale: number;
  alpha: number;
  parallax: number;
  color: string;
}

export interface EngineCallbacks {
  onPhase?: (phase: Phase) => void;
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

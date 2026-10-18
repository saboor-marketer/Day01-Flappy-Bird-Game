export const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

// Frame-rate independent exponential smoothing factor.
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

import type { Particle, ParticleKind } from "./types";
import { COLORS, FONT_STACK } from "./constants";
import { clamp } from "./math";

const DEFAULTS = {
  vx: 0,
  vy: 0,
  life: 0.5,
  size: 6,
  sizeEnd: 6,
  rot: 0,
  vr: 0,
  color: COLORS.puff,
  gravity: 0,
  drag: 0,
  sway: 0,
  phase: 0,
};

export function makeParticle(
  o: Partial<Particle> & { kind: ParticleKind; x: number; y: number },
): Particle {
  const life = o.life ?? DEFAULTS.life;
  return {
    ...DEFAULTS,
    ...o,
    life,
    maxLife: o.maxLife ?? life,
  };
}

export class Particles {
  items: Particle[] = [];
  private cap = 320;
  private time = 0;

  add(p: Particle) {
    if (this.items.length < this.cap) this.items.push(p);
  }

  clear() {
    this.items.length = 0;
  }

  update(dt: number) {
    this.time += dt;
    const items = this.items;
    let w = 0;
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) continue;
      p.vy += p.gravity * dt;
      if (p.drag) {
        const f = Math.exp(-p.drag * dt);
        p.vx *= f;
        p.vy *= f;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.sway) p.x += Math.cos(this.time * 7 + p.phase) * p.sway * dt;
      p.rot += p.vr * dt;
      items[w++] = p;
    }
    items.length = w;
  }

  draw(ctx: CanvasRenderingContext2D, behind: boolean) {
    for (const p of this.items) {
      const isBehind = p.kind === "puff" || p.kind === "dust";
      if (isBehind !== behind) continue;
      const t = clamp(p.life / p.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = t;
      switch (p.kind) {
        case "puff":
        case "dust": {
          const r = p.size + (p.sizeEnd - p.size) * (1 - t);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = t * (p.kind === "puff" ? 0.6 : 0.55);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "spark": {
          const r = p.size * (0.35 + t * 0.75);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.32, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r * 0.32, 0);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = COLORS.sparkHot;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "debris": {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          const s = p.size;
          ctx.fillRect(-s / 2, -s / 2, s, s);
          break;
        }
        case "feather": {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "popup": {
          ctx.translate(p.x, p.y);
          const sc = 1 + (1 - t) * 0.35;
          ctx.scale(sc, sc);
          ctx.font = `900 ${p.size}px ${FONT_STACK}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.lineWidth = p.size * 0.22;
          ctx.strokeStyle = "rgba(24,20,45,0.85)";
          ctx.strokeText(p.text ?? "", 0, 0);
          ctx.fillStyle = p.color;
          ctx.fillText(p.text ?? "", 0, 0);
          break;
        }
      }
      ctx.restore();
    }
  }
}

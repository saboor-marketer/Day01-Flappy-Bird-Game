import {
  COLORS,
  FONT_STACK,
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  PHYSICS,
  PIPES,
} from "./constants";
import { clamp, damp, lerp, rand } from "./math";
import { Particles, makeParticle } from "./particles";
import { Sound } from "./audio";
import type { Bird, Cloud, EngineCallbacks, Phase, Pipe } from "./types";

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function circleRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export class FlappyEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: EngineCallbacks;
  private scale = 1;

  phase: Phase = "ready";
  score = 0;
  best = 0;

  private bird: Bird;
  private pipes: Pipe[] = [];
  private particles = new Particles();
  private clouds: Cloud[] = [];
  private nextId = 1;

  private time = 0;
  private scrollX = 0;
  private groundOffset = 0;

  private shake = 0;
  private flash = 0;
  private flashColor = "#ffffff";
  private scorePop = 0;
  private deadTimer = 0;

  private skyGrad!: CanvasGradient;
  private sunGlow!: CanvasGradient;
  private vignette!: CanvasGradient;
  private pipeBodyGrad!: CanvasGradient;
  private pipeCapGrad!: CanvasGradient;

  private raf = 0;
  private lastT = 0;
  private looping = false;

  sound = new Sound();

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.cb = cb;
    this.bird = this.makeBird();
    this.initClouds();
    this.initGraphics();
    this.resetWorld();
  }

  // ---------------------------------------------------------------- setup
  private makeBird(): Bird {
    return {
      x: PHYSICS.birdX,
      y: PHYSICS.startY,
      vy: 0,
      rot: 0,
      wingPhase: 0,
      stretch: 1,
      flapBoost: 0,
    };
  }

  private initClouds() {
    this.clouds = Array.from({ length: 8 }, () => this.makeCloud(rand(0, GAME_WIDTH)));
  }

  private makeCloud(x: number): Cloud {
    return {
      x,
      y: rand(50, GROUND_Y - 140),
      scale: rand(0.55, 1.35),
      alpha: rand(0.2, 0.55),
      parallax: rand(0.12, 0.45),
      color: Math.random() < 0.5 ? COLORS.cloud : COLORS.cloudFar,
    };
  }

  private initGraphics() {
    const ctx = this.ctx;
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, COLORS.skyTop);
    sky.addColorStop(0.34, COLORS.skyMid);
    sky.addColorStop(0.6, COLORS.skyWarm);
    sky.addColorStop(0.8, COLORS.skyCoral);
    sky.addColorStop(1, COLORS.skyGold);
    this.skyGrad = sky;

    const sx = 252;
    const sy = GROUND_Y - 78;
    const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 150);
    glow.addColorStop(0, COLORS.sunGlowA);
    glow.addColorStop(1, COLORS.sunGlowB);
    this.sunGlow = glow;

    // cached pipe gradients (drawn in translated local space 0..width)
    const pw = PIPES.width;
    const body = ctx.createLinearGradient(0, 0, pw, 0);
    body.addColorStop(0, COLORS.pipeEdge);
    body.addColorStop(0.16, COLORS.pipeDark);
    body.addColorStop(0.5, COLORS.pipeLight);
    body.addColorStop(0.84, COLORS.pipeDark);
    body.addColorStop(1, COLORS.pipeEdge);
    this.pipeBodyGrad = body;

    const cw = pw + PIPES.capOverhang * 2;
    const cap = ctx.createLinearGradient(-PIPES.capOverhang, 0, cw - PIPES.capOverhang, 0);
    cap.addColorStop(0, COLORS.pipeEdge);
    cap.addColorStop(0.18, COLORS.pipeDark);
    cap.addColorStop(0.5, COLORS.pipeLight);
    cap.addColorStop(0.82, COLORS.pipeDark);
    cap.addColorStop(1, COLORS.pipeEdge);
    this.pipeCapGrad = cap;

    const vig = ctx.createRadialGradient(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_HEIGHT * 0.34,
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_HEIGHT * 0.72,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(10,6,30,0.4)");
    this.vignette = vig;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    this.scale = (w / GAME_WIDTH) * dpr;
  }

  setBest(best: number) {
    this.best = best;
  }

  setMuted(m: boolean) {
    this.sound.muted = m;
  }

  // ---------------------------------------------------------------- loop
  start() {
    if (this.looping) return;
    this.looping = true;
    this.lastT = 0;
    this.raf = requestAnimationFrame(this.loop);
  }

  dispose() {
    this.looping = false;
    cancelAnimationFrame(this.raf);
  }

  private loop = (t: number) => {
    if (!this.looping) return;
    this.raf = requestAnimationFrame(this.loop);
    const now = t / 1000;
    let dt = this.lastT ? now - this.lastT : 0;
    this.lastT = now;
    dt = Math.min(dt, 0.05);
    this.update(dt);
    this.draw();
  };

  // ---------------------------------------------------------------- state
  private setPhase(p: Phase) {
    if (this.phase === p) return;
    this.phase = p;
    this.cb.onPhase?.(p);
  }

  private resetWorld() {
    this.bird = this.makeBird();
    this.pipes = [];
    this.particles.clear();
    this.score = 0;
    this.deadTimer = 0;
    this.shake = 0;
    this.flash = 0;
    this.scorePop = 0;
  }

  startRun() {
    this.resetWorld();
    this.setPhase("playing");
    this.doFlap();
  }

  toMenu() {
    this.resetWorld();
    this.setPhase("ready");
  }

  private doFlap() {
    this.bird.vy = PHYSICS.flapVelocity;
    this.bird.stretch = 1.22;
    this.bird.flapBoost = 1;
    this.spawnFlapPuff();
    this.sound.flap();
  }

  flap() {
    if (this.phase === "playing") this.doFlap();
  }

  togglePause() {
    if (this.phase === "playing") this.setPhase("paused");
    else if (this.phase === "paused") this.setPhase("playing");
  }

  handleFlapInput() {
    switch (this.phase) {
      case "ready":
        this.startRun();
        break;
      case "playing":
        this.doFlap();
        break;
      case "paused":
        this.setPhase("playing");
        break;
      case "dead":
        if (this.deadTimer > 0.35) this.startRun();
        break;
    }
  }

  handlePauseInput() {
    this.togglePause();
  }

  private die() {
    if (this.phase !== "playing") return;
    this.setPhase("dying");
    this.bird.vy = -170;
    this.shake = 15;
    this.flash = 0.9;
    this.flashColor = "#ffffff";
    this.sound.hit();
    this.spawnDeath();
  }

  private land() {
    this.bird.y = GROUND_Y - PHYSICS.birdRadius;
    this.bird.vy = 0;
    this.setPhase("dead");
    this.deadTimer = 0;
    this.shake = Math.max(this.shake, 9);
    this.spawnDust();
    this.sound.land();
    this.sound.die();
    this.cb.onGameOver?.(this.score);
  }

  // ---------------------------------------------------------------- update
  private get worldSpeed() {
    if (this.phase === "playing") return PHYSICS.pipeSpeed;
    if (this.phase === "ready") return PHYSICS.pipeSpeed * 0.4;
    return 0;
  }

  update(dt: number) {
    this.time += dt;

    const ws = this.worldSpeed;
    if (ws > 0) {
      this.scrollX += ws * dt;
      this.groundOffset += ws * dt;
      for (const c of this.clouds) {
        c.x -= ws * c.parallax * dt;
        if (c.x < -70) {
          const nc = this.makeCloud(GAME_WIDTH + rand(20, 140));
          c.x = nc.x;
          c.y = nc.y;
          c.scale = nc.scale;
          c.alpha = nc.alpha;
          c.parallax = nc.parallax;
          c.color = nc.color;
        }
      }
    }

    switch (this.phase) {
      case "ready":
        this.updateReady(dt);
        break;
      case "playing":
        this.updatePlaying(dt);
        break;
      case "dying":
        this.updateDying(dt);
        break;
      case "dead":
        this.deadTimer += dt;
        break;
      case "paused":
        break;
    }

    this.particles.update(dt);

    this.shake *= Math.exp(-7 * dt);
    if (this.shake < 0.15) this.shake = 0;
    this.flash = Math.max(0, this.flash - dt * 3.4);
    this.scorePop = Math.max(0, this.scorePop - dt * 3.6);

    this.bird.stretch = lerp(this.bird.stretch, 1, damp(12, dt));
    this.bird.flapBoost = Math.max(0, this.bird.flapBoost - dt * 4);
  }

  private updateReady(dt: number) {
    const b = this.bird;
    b.y = PHYSICS.startY + Math.sin(this.time * 2.4) * 10;
    b.rot = Math.sin(this.time * 2.4) * 0.08;
    b.wingPhase += dt * 11;
  }

  private updatePlaying(dt: number) {
    const b = this.bird;
    b.vy = Math.min(b.vy + PHYSICS.gravity * dt, PHYSICS.maxFall);
    b.y += b.vy * dt;

    // ceiling (not lethal)
    if (b.y < PHYSICS.birdRadius) {
      b.y = PHYSICS.birdRadius;
      if (b.vy < 0) b.vy = 0;
    }

    const upTarget = -0.45;
    const downTarget = clamp(b.vy / PHYSICS.maxFall, 0, 1) * 1.4;
    const target = b.vy < 0 ? upTarget : downTarget;
    b.rot = lerp(b.rot, target, damp(9, dt));
    b.wingPhase += dt * (b.vy < 0 ? 22 : 9);

    // move pipes
    for (const p of this.pipes) p.x -= PHYSICS.pipeSpeed * dt;

    // spawn
    const last = this.pipes[this.pipes.length - 1];
    if (!last || last.x <= GAME_WIDTH - PIPES.spacing) this.spawnPipe();
    this.pipes = this.pipes.filter((p) => p.x + PIPES.width > -10);

    // score + collision
    for (const p of this.pipes) {
      if (!p.scored && b.x > p.x + PIPES.width / 2) {
        p.scored = true;
        this.score++;
        this.scorePop = 1;
        this.spawnScore(p.x + PIPES.width / 2, p.gapY);
        this.sound.score();
        this.cb.onScore?.(this.score);
      }
      const gapTop = p.gapY - p.gapH / 2;
      const gapBot = p.gapY + p.gapH / 2;
      const hitTop = circleRect(
        b.x,
        b.y,
        PHYSICS.birdRadius,
        p.x,
        -20,
        PIPES.width,
        gapTop + 20,
      );
      const hitBot = circleRect(
        b.x,
        b.y,
        PHYSICS.birdRadius,
        p.x,
        gapBot,
        PIPES.width,
        GROUND_Y - gapBot,
      );
      if (hitTop || hitBot) {
        this.die();
        return;
      }
    }

    // ground
    if (b.y + PHYSICS.birdRadius >= GROUND_Y) {
      b.y = GROUND_Y - PHYSICS.birdRadius;
      this.die();
      return;
    }
  }

  private updateDying(dt: number) {
    const b = this.bird;
    b.vy = Math.min(b.vy + PHYSICS.gravity * dt, PHYSICS.maxFall);
    b.y += b.vy * dt;
    b.rot = lerp(b.rot, 1.55, damp(7, dt));
    b.wingPhase += dt * 4;
    if (b.y + PHYSICS.birdRadius >= GROUND_Y) this.land();
  }

  private spawnPipe() {
    const gapH = Math.max(
      PIPES.gapMin,
      PIPES.gapStart - this.score * PIPES.gapShrink,
    );
    const minCenter = PIPES.minTop + gapH / 2;
    const maxCenter = GROUND_Y - PIPES.bottomMargin - gapH / 2;
    let center = rand(minCenter, maxCenter);
    const prev = this.pipes[this.pipes.length - 1];
    if (prev) {
      center = clamp(center, prev.gapY - PIPES.maxDelta, prev.gapY + PIPES.maxDelta);
      center = clamp(center, minCenter, maxCenter);
    } else {
      center = PHYSICS.startY;
    }
    this.pipes.push({
      id: this.nextId++,
      x: GAME_WIDTH + 6,
      gapY: center,
      gapH,
      scored: false,
    });
  }

  // ---------------------------------------------------------------- fx spawn
  private spawnFlapPuff() {
    const b = this.bird;
    for (let i = 0; i < 5; i++) {
      this.particles.add(
        makeParticle({
          kind: "puff",
          x: b.x - 12 + rand(-3, 3),
          y: b.y + 6 + rand(-3, 3),
          vx: rand(-70, -30),
          vy: rand(10, 45),
          life: rand(0.3, 0.5),
          size: rand(3, 5),
          sizeEnd: rand(10, 15),
          drag: 2,
        }),
      );
    }
  }

  private spawnScore(x: number, y: number) {
    for (let i = 0; i < 14; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(60, 190);
      this.particles.add(
        makeParticle({
          kind: "spark",
          x,
          y: y + rand(-30, 30),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: rand(0.35, 0.6),
          size: rand(3, 6),
          color: Math.random() < 0.5 ? COLORS.spark : COLORS.sparkHot,
          gravity: 120,
          drag: 1.6,
          vr: rand(-8, 8),
        }),
      );
    }
    this.particles.add(
      makeParticle({
        kind: "popup",
        x,
        y: y - 20,
        vy: -55,
        life: 0.8,
        size: 26,
        color: COLORS.spark,
        text: "+1",
      }),
    );
  }

  private spawnDeath() {
    const b = this.bird;
    const ring = 8;
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      this.particles.add(
        makeParticle({
          kind: "puff",
          x: b.x,
          y: b.y,
          vx: Math.cos(a) * rand(90, 150),
          vy: Math.sin(a) * rand(90, 150),
          life: rand(0.35, 0.6),
          size: 6,
          sizeEnd: 22,
          drag: 3,
        }),
      );
    }
    for (let i = 0; i < 18; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(70, 260);
      this.particles.add(
        makeParticle({
          kind: "debris",
          x: b.x,
          y: b.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60,
          life: rand(0.6, 1.1),
          size: rand(3, 7),
          color: Math.random() < 0.5 ? COLORS.pipe : COLORS.birdBody,
          gravity: 900,
          drag: 0.6,
          vr: rand(-12, 12),
        }),
      );
    }
    for (let i = 0; i < 6; i++) {
      const a = rand(0, Math.PI * 2);
      this.particles.add(
        makeParticle({
          kind: "feather",
          x: b.x,
          y: b.y,
          vx: Math.cos(a) * rand(40, 120),
          vy: Math.sin(a) * rand(40, 120) - 40,
          life: rand(0.9, 1.5),
          size: rand(5, 8),
          color: COLORS.feather,
          gravity: 220,
          drag: 1.2,
          sway: rand(20, 55),
          phase: rand(0, 6.28),
          vr: rand(-5, 5),
        }),
      );
    }
  }

  private spawnDust() {
    for (let i = 0; i < 10; i++) {
      this.particles.add(
        makeParticle({
          kind: "dust",
          x: this.bird.x + rand(-8, 8),
          y: GROUND_Y - rand(0, 6),
          vx: rand(-90, 90),
          vy: rand(-70, -20),
          life: rand(0.4, 0.8),
          size: rand(4, 7),
          sizeEnd: rand(14, 22),
          color: COLORS.dust,
          gravity: 260,
          drag: 2,
        }),
      );
    }
  }

  // ---------------------------------------------------------------- draw
  draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const sx = (Math.random() * 2 - 1) * this.shake;
    const sy = (Math.random() * 2 - 1) * this.shake;
    ctx.translate(sx, sy);

    this.drawSky(ctx);
    this.drawRidges(ctx);
    this.drawClouds(ctx);
    this.drawPipes(ctx);
    this.drawGround(ctx);

    this.particles.draw(ctx, true);
    this.drawBird(ctx);
    this.particles.draw(ctx, false);

    if (this.phase !== "ready") this.drawScore(ctx);

    // flash + vignette (unshaken)
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.7;
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private drawSky(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // sun
    ctx.save();
    ctx.fillStyle = this.sunGlow;
    ctx.fillRect(102, GROUND_Y - 228, 300, 300);
    ctx.restore();
    ctx.fillStyle = COLORS.sun;
    ctx.beginPath();
    ctx.arc(252, GROUND_Y - 78, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawRidges(ctx: CanvasRenderingContext2D) {
    this.drawRidge(ctx, GROUND_Y - 8, 46, 0.0062, COLORS.mountainFar, 0.16);
    this.drawRidge(ctx, GROUND_Y + 8, 32, 0.0115, COLORS.mountainNear, 0.38);
  }

  private drawRidge(
    ctx: CanvasRenderingContext2D,
    baseY: number,
    amp: number,
    freq: number,
    color: string,
    parallax: number,
  ) {
    const off = this.scrollX * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, GAME_HEIGHT);
    for (let x = 0; x <= GAME_WIDTH; x += 6) {
      const y =
        baseY +
        Math.sin((x + off) * freq) * amp +
        Math.sin((x + off) * freq * 2.7 + 1.3) * amp * 0.35;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  private drawClouds(ctx: CanvasRenderingContext2D) {
    for (const c of this.clouds) {
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = c.color;
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.arc(19, 4, 13, 0, Math.PI * 2);
      ctx.arc(-19, 4, 13, 0, Math.PI * 2);
      ctx.arc(4, -10, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPipes(ctx: CanvasRenderingContext2D) {
    for (const p of this.pipes) {
      const gapTop = p.gapY - p.gapH / 2;
      const gapBot = p.gapY + p.gapH / 2;
      ctx.save();
      ctx.translate(p.x, 0);
      this.drawPipeBody(ctx, 0, gapTop, true);
      this.drawPipeBody(ctx, gapBot, GROUND_Y, false);
      ctx.restore();
    }
  }

  private drawPipeBody(
    ctx: CanvasRenderingContext2D,
    y0: number,
    y1: number,
    capAtBottom: boolean,
  ) {
    const w = PIPES.width;
    const h = y1 - y0;
    if (h <= 0) return;
    ctx.fillStyle = this.pipeBodyGrad;
    ctx.fillRect(0, y0, w, h);
    ctx.strokeStyle = COLORS.pipeEdge;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(1, y0);
    ctx.lineTo(1, y1);
    ctx.moveTo(w - 1, y0);
    ctx.lineTo(w - 1, y1);
    ctx.stroke();

    // cap
    const capH = PIPES.capHeight;
    const capW = w + PIPES.capOverhang * 2;
    const capX = -PIPES.capOverhang;
    const capY = capAtBottom ? y1 - capH : y0;
    ctx.fillStyle = this.pipeCapGrad;
    rr(ctx, capX, capY, capW, capH, 5);
    ctx.fill();
    ctx.strokeStyle = COLORS.pipeEdge;
    ctx.lineWidth = 2;
    rr(ctx, capX, capY, capW, capH, 5);
    ctx.stroke();
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    const gy = GROUND_Y;
    // dirt
    ctx.fillStyle = COLORS.dirt;
    ctx.fillRect(0, gy + 16, GAME_WIDTH, GAME_HEIGHT - gy - 16);
    // dirt stripes
    const off2 = ((this.groundOffset % 26) + 26) % 26;
    ctx.fillStyle = COLORS.dirtDark;
    for (let x = -off2; x < GAME_WIDTH + 26; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 16);
      ctx.lineTo(x + 12, gy + 16);
      ctx.lineTo(x + 12 - 16, GAME_HEIGHT);
      ctx.lineTo(x - 16, GAME_HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    // grass band
    ctx.fillStyle = COLORS.grass;
    ctx.fillRect(0, gy, GAME_WIDTH, 14);
    ctx.fillStyle = COLORS.grassLight;
    ctx.fillRect(0, gy, GAME_WIDTH, 4);
    // scalloped tufts
    const off = ((this.groundOffset % 14) + 14) % 14;
    ctx.fillStyle = COLORS.grassDark;
    for (let x = -off; x < GAME_WIDTH + 14; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, gy + 14);
      ctx.lineTo(x + 7, gy + 4);
      ctx.lineTo(x + 14, gy + 14);
      ctx.closePath();
      ctx.fill();
    }
    // shadow line
    ctx.fillStyle = "rgba(20,12,40,0.22)";
    ctx.fillRect(0, gy + 14, GAME_WIDTH, 3);
  }

  private drawBird(ctx: CanvasRenderingContext2D) {
    const b = this.bird;
    const wingFlap = Math.sin(b.wingPhase) * 0.5;
    const burst = Math.sin(clamp(b.flapBoost, 0, 1) * Math.PI) * 1.15;
    const wingAngle = wingFlap + burst - 0.15;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    const s = b.stretch;
    ctx.scale(1 / s, s);

    // tail
    ctx.fillStyle = COLORS.birdBodyDark;
    ctx.beginPath();
    ctx.moveTo(-10, -6);
    ctx.lineTo(-24, -11);
    ctx.lineTo(-21, 2);
    ctx.lineTo(-10, 3);
    ctx.closePath();
    ctx.fill();

    // body
    ctx.fillStyle = COLORS.birdBody;
    ellipse(ctx, 0, 0, 16, 12.5);
    ctx.fill();

    // belly
    ctx.fillStyle = COLORS.birdBelly;
    ellipse(ctx, 2, 4, 10, 7);
    ctx.fill();

    // wing
    ctx.save();
    ctx.translate(-2, 1);
    ctx.rotate(wingAngle);
    ctx.fillStyle = COLORS.wing;
    ellipse(ctx, -3, 0, 9, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(120,70,10,0.35)";
    ctx.lineWidth = 1.2;
    ellipse(ctx, -3, 0, 9, 6);
    ctx.stroke();
    ctx.restore();

    // eye
    ctx.fillStyle = COLORS.eyeWhite;
    ctx.beginPath();
    ctx.arc(6.5, -4.5, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.eyePupil;
    ctx.beginPath();
    ctx.arc(8, -4.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // beak
    ctx.fillStyle = COLORS.beak;
    ctx.beginPath();
    ctx.moveTo(12, -4);
    ctx.lineTo(22, -1);
    ctx.lineTo(12, 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.beakDark;
    ctx.beginPath();
    ctx.moveTo(12, 1);
    ctx.lineTo(20, 3);
    ctx.lineTo(12, 5);
    ctx.closePath();
    ctx.fill();

    // outline
    ctx.strokeStyle = "rgba(60,35,10,0.4)";
    ctx.lineWidth = 1.6;
    ellipse(ctx, 0, 0, 16, 12.5);
    ctx.stroke();

    ctx.restore();
  }

  private drawScore(ctx: CanvasRenderingContext2D) {
    const s = 1 + this.scorePop * 0.4;
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 92);
    ctx.scale(s, s);
    ctx.font = `900 46px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(22,18,45,0.85)";
    ctx.strokeText(String(this.score), 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(this.score), 0, 0);
    ctx.restore();

    if (this.best > 0) {
      ctx.save();
      ctx.font = `800 13px ${FONT_STACK}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(22,18,45,0.6)";
      ctx.lineWidth = 3;
      const label = `BEST ${this.best}`;
      ctx.strokeText(label, 14, 26);
      ctx.fillText(label, 14, 26);
      ctx.restore();
    }
  }
}

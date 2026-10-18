# Flappy Sunset — Tap to Fly

A polished, playable **Flappy Bird** browser game with a warm sunset theme, juicy feedback, and buttery 60fps canvas rendering. Built with **React 19 + Vite + Tailwind CSS 4**, bundled into a single self-contained `dist/index.html` (zero external assets).

## Features

- **Instant fun** — tap / click / Space and you're flying in under 10 seconds
- **Tight controls** — keyboard (Space / W / Up), mouse, and touch via low-latency `pointerdown`
- **Juice everywhere** — screen shake, hit flash, flap puffs, score spark bursts with floating `+1`, death debris + feathers, landing dust, squash-and-stretch bird, animated wing flap, velocity-based tilt, popping score
- **Full game flow** — start screen, live score HUD, pause menu (resume / restart / main menu), bounce-then-fall death animation, game-over card with instant restart (Space / tap after 350ms)
- **Progression** — score system, medal tiers (Bronze 5+ / Silver 10+ / Gold 20+ / Platinum 30+), "New Best" badge, rank display
- **Local high-score table** — top 10 persisted in `localStorage`, new entry highlighted
- **Cohesive sunset theme** — gradient dusk sky, glowing sun, parallax mountains + clouds, complementary green pipes, scrolling grass/dirt ground, golden bird, amber glassmorphic UI
- **60fps engineering** — fixed 360×640 logical world, delta-time physics, DPR capped at 2, cached gradients, pooled particles, no per-frame allocation in hot paths
- **Synthesized audio** — flap / score / hit / land sounds via WebAudio, no audio files, `M` to mute

## Controls

| Input | Action |
|---|---|
| Space / W / Up / Click / Tap | Flap (also starts game & instant-restarts) |
| P / Esc | Pause / resume |
| M | Mute / unmute |
| Buttons | Pause, mute, resume, restart, main menu |

The game also auto-pauses when the tab is hidden mid-run.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/index.html (single file)
npm run preview  # serve the production build
```

Open `http://localhost:5173` (dev) or the preview URL, then tap / press Space to fly.

## Project structure

```
src/
  App.tsx                  # Stage sizing, engine lifecycle, keyboard/pointer wiring, overlays
  main.tsx                 # React entry
  index.css                # Tailwind + --s UI scale variable + overlay keyframes
  game/
    engine.ts              # Game loop, physics, collision, canvas rendering, FX spawning
    constants.ts           # World size, physics tuning, pipe tuning, sunset palette
    particles.ts           # Pooled particle system (puff/spark/debris/dust/feather/popup)
    audio.ts               # Tiny WebAudio synth (flap/score/hit/land/die)
    storage.ts             # localStorage top-10 high scores
    types.ts               # Phase, Bird, Pipe, Particle, Cloud, EngineCallbacks
    math.ts                # clamp/lerp/rand/damp helpers
  components/
    StartScreen.tsx        # Title, Play, control hints, best score
    HUD.tsx                # Pause + mute buttons
    PauseOverlay.tsx       # Resume / restart / main menu
    GameOverCard.tsx       # Score, medal, best/rank, top-scores, play again
    HighScoreTable.tsx     # Ranked score list with "new" highlight
    ui.tsx                 # GameButton + IconButton (scaled via --s)
```

## How it works

- **Fixed logical world (360×640).** The stage preserves aspect ratio and letterboxes; a `--s` CSS variable scales all overlay UI proportionally. Physics constants never change across devices.
- **React owns UI, canvas owns the game.** `FlappyEngine` runs a `requestAnimationFrame` loop with clamped delta time (`dt <= 0.05`) and notifies React only on `onPhase` / `onScore` / `onGameOver` — so no re-renders per frame.
- **Phases:** `ready → playing ⇄ paused → dying → dead`. Dying bounces the bird up then falls; landing triggers the game-over save + card.
- **Difficulty ramp:** pipe gap shrinks 2px per point (176 → 140 min), gap centers are clamped to ±128px from the previous pipe for fairness. First pipe is centered at the bird's start height for a gentle opening.
- **Collision:** circle-vs-rect for top/bottom pipes, ground impact, forgiving non-lethal ceiling.

## Tuning

Key values live in `src/game/constants.ts`:

```ts
PHYSICS = { gravity: 1500, flapVelocity: -430, maxFall: 560, pipeSpeed: 138, ... }
PIPES   = { gapStart: 176, gapMin: 140, gapShrink: 2, spacing: 202, ... }
```

## Browser support

Modern evergreen browsers (Chrome / Edge / Firefox / Safari) on desktop and mobile. Viewport is locked (`maximum-scale=1, user-scalable=no, viewport-fit=cover`) with `touch-action: none` to prevent scroll/zoom gestures during play.

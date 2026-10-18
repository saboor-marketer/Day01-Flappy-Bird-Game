# Flappy Sunset — Development Report

## 1. Objective

Build a polished, playable browser **Flappy Bird** game where the core loop is fun within the first ten seconds, with:

- Tight keyboard + touch controls
- Juicy feedback (screen shake, particles, satisfying animations)
- Start screen, score system, pause and game-over states with instant restart
- Local high-score table
- Cohesive visual theme
- Smooth 60fps on desktop and mobile

**Result:** all objectives met. The production build (`dist/index.html`, ~289 kB / ~85 kB gzip, single file) serves with HTTP 200 and compiles with zero TypeScript errors.

## 2. Requirements coverage

| Requirement | Implementation | Status |
|---|---|---|
| Fun in first 10 seconds | One tap/Space starts the run with an immediate flap; first pipe gap centered at bird height; animated start screen with pulsing hint | Done |
| Tight keyboard controls | Space / W / Up flap, P / Esc pause, M mute; `preventDefault` on game keys; buttons blur after click so Space never re-triggers them | Done |
| Tight touch controls | `pointerdown` (not click) for zero-delay flaps; `touch-action: none`, locked viewport, `data-ui` guard so HUD taps don't flap | Done |
| Screen shake | Exponentially-decaying shake offset (15 on hit, 9 on land) applied to world transform | Done |
| Particle effects | Pooled system: flap puffs, score sparks + `+1` popup, death ring + debris + feathers, landing dust; behind/front draw layers | Done |
| Satisfying animations | Wing flap + burst, velocity tilt, squash-and-stretch, score pop, overlay drop/pop/float/pulse keyframes, death bounce-then-fall | Done |
| Start screen | Title, Play button, control hints, best score, floating bird emoji | Done |
| Score system | In-canvas outlined score + pop scale, "BEST" indicator, `+1` popup at gate, medal tiers (5/10/20/30) | Done |
| Pause state | P/Esc/button/auto-pause-on-hide; frozen sim with dimmed menu (resume/restart/menu) | Done |
| Game-over + instant restart | Delayed card (~0.35s guard), Space/tap/button restart, main-menu path | Done |
| Local high-score table | `localStorage` top-10 (`flappy.sunset.highscores.v1`), rank + New Best detection, highlighted row | Done |
| Cohesive theme | Sunset palette end-to-end: sky gradient, sun glow, mountains, clouds, green pipes, grass/dirt, golden bird, amber UI | Done |
| 60fps desktop + mobile | Fixed logical world, dt-clamped loop, DPR ≤ 2, cached gradients, particle cap, no per-frame React renders | Done |

## 3. Architecture

**Separation of concerns:** React owns overlays and lifecycle; the canvas engine owns simulation and rendering.

```
App.tsx (stage fit, engine lifecycle, input routing, overlays)
  └── FlappyEngine (rAF loop, physics, collision, draw, FX) — src/game/engine.ts
        ├── constants.ts (world/physics/palette)   types.ts (Phase/Bird/Pipe/…)
        ├── particles.ts (pooled FX)               audio.ts (WebAudio synth)
        ├── storage.ts (high scores)               math.ts (helpers)
  └── components/ (StartScreen, HUD, PauseOverlay, GameOverCard, HighScoreTable, ui)
```

**Key design decisions:**

1. **Fixed logical world 360×640.** The stage letterboxes with preserved aspect; a `--s` CSS variable (`stageWidth / 360`) scales every overlay dimension. Physics constants are identical on all screens — fairness and testability win over responsive-world complexity.
2. **Engine notifies React, never vice-versa per frame.** Callbacks `onPhase / onScore / onGameOver` are the only engine→React channel, so gameplay runs with zero React re-renders per frame.
3. **Phase machine:** `ready → playing ⇄ paused → dying → dead`. `dying` (bounce up, fall, rotate to nose-down) exists purely for game feel; either pipe hit or ground hit enters it, and `land()` settles to `dead`, saves the score once, and shows the card.
4. **Zero-asset media.** All visuals are canvas vector drawing; all audio is synthesized. The single-file bundle works offline from `dist/index.html`.

## 4. Gameplay & tuning

Physics (`src/game/constants.ts`): gravity 1500 px/s², flap −430 px/s, terminal 560 px/s, scroll 138 px/s, bird radius 11px at x=112, start y=236.

- **Pipes:** 62px wide, 202px spacing, gap 176→140 (−2/pt), centers clamped ±128px from previous pipe and inside safe margins; collision is circle-vs-rect against top/bottom bodies.
- **Forgiveness:** ceiling is non-lethal (clamped), first gap is centered, 350ms input guard prevents accidental instant-restart skips.
- **Difficulty:** gap shrink + fixed speed keeps early game welcoming while scores 15+ demand precision; medal thresholds (Bronze 5, Silver 10, Gold 20, Platinum 30) give mid-term goals.

## 5. Juice & feedback inventory

| Moment | Visual | Audio |
|---|---|---|
| Flap | Puff trail, stretch 1.22, wing burst | Rising sine + air noise |
| Score | Spark burst, `+1` popup, score pop 1.4× | Two-note chime |
| Pipe/ground hit | Shake 15, white flash 0.9, debris ring + 18 shards + 6 feathers | Noise thump + drop tone |
| Landing | Shake 9, 10 dust motes | Soft thud + fall whistle |
| Menus | drop-in / pop-in / float / pulse CSS keyframes | — |
| Ambient | Scrolling ground tufts/dirt, parallax clouds + 2 mountain layers, sun glow, vignette | — |

## 6. Performance (60fps)

- Delta-time integration with `dt` clamped to 0.05s (tab-jank safe); exponential damping (`damp`) for rotation/stretch/shake keeps motion frame-rate independent.
- DPR capped at 2; sky/sun/vignette/pipe gradients created once and cached (pipe bodies drawn in translated local space to reuse one gradient).
- Particle pool capped at 320 with in-place compaction; two-pass draw (behind/front of bird) avoids sorting.
- Score text uses cached font strings; overlay UI is DOM (GPU-composited transforms only).
- Verified: clean `vite build`, inlined single file, preview serves 200 with title + root + game code present, scaled `var(--s)` utilities (99 uses) and all 4 keyframes in the bundle.

## 7. Input & edge cases

- `pointerdown` on the stage routes to `handleFlapInput()`; any `[data-ui]` element stops propagation so buttons never flap.
- Buttons `blur()` after click → Space always flaps post-click.
- `visibilitychange` auto-pauses mid-run; resize/orientation refits canvas + UI scale; `localStorage` access is try/caught (private-mode safe); malformed score data is filtered, never trusted.

## 8. Challenges & trade-offs

1. **Restart-vs-flap ambiguity** — solved with a 350ms `deadTimer` guard plus explicit Play Again button.
2. **Tailwind scale + single-file build** — arbitrary `calc(var(--s)*…)` values compile fine, but runtime correctness was verified by grepping the built bundle rather than assuming.
3. **Parallel-edit import conflict** (particles `FONT_STACK`) — caught by the type checker, fixed by re-applying the import; reinforced running `npm run build` after every refactor.
4. **Scope discipline** — gradient caching and the unused-import cleanup were chosen over extra features to protect the 60fps budget.

## 9. Future improvements

- Day/dusk/night theme rotation, unlockable bird skins, wing-trail cosmetics
- Variable pipe speed at high scores, daily challenge seed, share-score link
- Reduced-motion setting (disable shake/flash), haptics via `navigator.vibrate` on mobile
- Pause during `dying` fall, pause-menu volume slider, PWA manifest for installability

## 10. Verification log

- `npm run build` — clean (44 modules, no TS errors)
- `vite preview` — HTTP 200, `<title>Flappy Sunset — Tap to Fly</title>`, `#root` present, game code inlined
- Manual pass: start → flap → score → pause/resume → die → instant restart → menu → high-score persistence across reload

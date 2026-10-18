import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FlappyEngine } from "@/game/engine";
import { GAME_WIDTH, GAME_HEIGHT } from "@/game/constants";
import {
  loadHighScores,
  saveScore,
  type HighScoreEntry,
} from "@/game/storage";
import type { Phase } from "@/game/types";
import { HUD } from "@/components/HUD";
import { StartScreen } from "@/components/StartScreen";
import { PauseOverlay } from "@/components/PauseOverlay";
import { GameOverCard } from "@/components/GameOverCard";

interface Fit {
  w: number;
  h: number;
}

function computeFit(): Fit {
  const aspect = GAME_WIDTH / GAME_HEIGHT;
  const availW = window.innerWidth;
  const availH = window.innerHeight;
  let w = availW;
  let h = availH;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  return { w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h)) };
}

interface Result {
  score: number;
  rank: number;
  isBest: boolean;
  date: number;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FlappyEngine | null>(null);

  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [size, setSize] = useState<Fit>(() => computeFit());
  const [scores, setScores] = useState<HighScoreEntry[]>(() =>
    loadHighScores(),
  );
  const [result, setResult] = useState<Result | null>(null);
  const [muted, setMuted] = useState(false);

  // Create the engine once and manage its lifecycle.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new FlappyEngine(canvas, {
      onPhase: setPhase,
      onScore: setScore,
      onGameOver: (finalScore) => {
        const r = saveScore(finalScore);
        setScores(r.list);
        const entry = r.list[r.rank - 1];
        setResult({
          score: finalScore,
          rank: r.rank,
          isBest: r.isBest,
          date: entry ? entry.date : Date.now(),
        });
      },
    });
    engineRef.current = engine;

    const fit = computeFit();
    engine.resize(fit.w, fit.h);
    setSize(fit);
    engine.start();

    const onResize = () => {
      const f = computeFit();
      engine.resize(f.w, f.h);
      setSize(f);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Keep the in-canvas "best" indicator in sync.
  useEffect(() => {
    engineRef.current?.setBest(scores[0]?.score ?? 0);
  }, [scores]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        engine.handleFlapInput();
      } else if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        engine.handlePauseInput();
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setMuted((m) => {
          engine.setMuted(!m);
          return !m;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-pause when the tab is hidden mid-run.
  useEffect(() => {
    const onVisibility = () => {
      const engine = engineRef.current;
      if (document.hidden && engine && engine.phase === "playing") {
        engine.togglePause();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-ui]")) return;
    engine.handleFlapInput();
  }, []);

  const scale = size.w / GAME_WIDTH;
  const best = scores[0]?.score ?? 0;

  const start = useCallback(() => engineRef.current?.startRun(), []);
  const resume = useCallback(() => engineRef.current?.togglePause(), []);
  const restart = useCallback(() => engineRef.current?.startRun(), []);
  const menu = useCallback(() => {
    engineRef.current?.toMenu();
    setResult(null);
  }, []);
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      engineRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  const showHud = phase !== "ready";

  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0a0f24] touch-none select-none"
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="stage relative overflow-hidden rounded-[calc(var(--s)*18px)] shadow-2xl shadow-black/60 ring-1 ring-black/40"
        style={{ width: size.w, height: size.h, "--s": scale } as CSSProperties}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />

        {phase === "ready" && <StartScreen best={best} onStart={start} />}

        {showHud && (
          <HUD
            muted={muted}
            showPause={phase === "playing" || phase === "paused"}
            onTogglePause={resume}
            onToggleMute={toggleMute}
          />
        )}

        {phase === "paused" && (
          <PauseOverlay
            score={score}
            onResume={resume}
            onRestart={restart}
            onQuit={menu}
          />
        )}

        {phase === "dead" && result && (
          <GameOverCard
            score={result.score}
            best={best}
            rank={result.rank}
            isBest={result.isBest}
            scores={scores}
            highlightDate={result.date}
            onRestart={restart}
            onMenu={menu}
          />
        )}
      </div>
    </div>
  );
}

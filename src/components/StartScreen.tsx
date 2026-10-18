import { GameButton } from "./ui";

interface StartScreenProps {
  best: number;
  onStart: () => void;
}

export function StartScreen({ best, onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[calc(var(--s)*24px)]">
      <div className="anim-drop flex flex-col items-center">
        <div
          className="anim-float leading-none"
          style={{ fontSize: "calc(var(--s) * 62px)" }}
          role="img"
          aria-label="bird"
        >
          🐤
        </div>
        <h1
          className="font-black tracking-tight bg-gradient-to-b from-amber-200 via-amber-300 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_calc(var(--s)*4px)_0_rgba(60,25,5,0.5)]"
          style={{
            fontSize: "calc(var(--s) * 56px)",
            letterSpacing: "calc(var(--s) * -1px)",
            lineHeight: 1,
          }}
        >
          FLAPPY
        </h1>
        <p
          className="mt-[calc(var(--s)*2px)] font-extrabold uppercase text-white/80"
          style={{
            fontSize: "calc(var(--s) * 15px)",
            letterSpacing: "calc(var(--s) * 6px)",
          }}
        >
          Sunset Run
        </p>
      </div>

      <div
        className="anim-pop mt-[calc(var(--s)*26px)] flex flex-col items-center gap-[calc(var(--s)*14px)]"
        style={{ animationDelay: "120ms" }}
      >
        <GameButton onClick={onStart}>▶ &nbsp;Play</GameButton>

        <p
          className="anim-pulse font-bold text-white/90"
          style={{ fontSize: "calc(var(--s) * 15px)" }}
        >
          Tap · Click · Space to flap
        </p>

        <div
          className="rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm px-[calc(var(--s)*16px)] py-[calc(var(--s)*10px)]"
          style={{ fontSize: "calc(var(--s) * 12px)" }}
        >
          <p className="font-semibold text-white/70">
            <span className="text-amber-300">Space/Click</span> flap &nbsp;·&nbsp;{" "}
            <span className="text-amber-300">P</span> pause &nbsp;·&nbsp;{" "}
            <span className="text-amber-300">M</span> mute
          </p>
          {best > 0 && (
            <p
              className="mt-[calc(var(--s)*6px)] font-extrabold text-amber-200"
              style={{ fontSize: "calc(var(--s) * 14px)" }}
            >
              🏆 Best {best}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

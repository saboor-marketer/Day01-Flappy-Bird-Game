import { GameButton } from "./ui";

interface PauseOverlayProps {
  score: number;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export function PauseOverlay({
  score,
  onResume,
  onRestart,
  onQuit,
}: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b1024]/60 backdrop-blur-[2px] px-[calc(var(--s)*24px)]">
      <div className="anim-pop flex flex-col items-center gap-[calc(var(--s)*16px)]">
        <h2
          className="font-black text-white drop-shadow-[0_calc(var(--s)*3px)_0_rgba(0,0,0,0.4)]"
          style={{ fontSize: "calc(var(--s) * 40px)", lineHeight: 1 }}
        >
          Paused
        </h2>
        <p
          className="font-bold text-amber-200"
          style={{ fontSize: "calc(var(--s) * 20px)" }}
        >
          Score {score}
        </p>
        <div className="flex flex-col items-center gap-[calc(var(--s)*10px)]">
          <GameButton onClick={onResume}>Resume</GameButton>
          <GameButton variant="ghost" onClick={onRestart}>
            Restart
          </GameButton>
          <GameButton variant="ghost" onClick={onQuit}>
            Main Menu
          </GameButton>
        </div>
        <p
          className="anim-pulse text-white/60"
          style={{ fontSize: "calc(var(--s) * 12px)" }}
        >
          Press P or tap to resume
        </p>
      </div>
    </div>
  );
}

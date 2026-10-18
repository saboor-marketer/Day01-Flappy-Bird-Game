import type { HighScoreEntry } from "@/game/storage";
import { GameButton } from "./ui";
import { HighScoreTable } from "./HighScoreTable";

interface GameOverCardProps {
  score: number;
  best: number;
  rank: number;
  isBest: boolean;
  scores: HighScoreEntry[];
  highlightDate?: number;
  onRestart: () => void;
  onMenu: () => void;
}

function medalFor(score: number) {
  if (score >= 30) return { emoji: "💎", name: "Platinum", ring: "from-cyan-200 to-sky-400" };
  if (score >= 20) return { emoji: "🥇", name: "Gold", ring: "from-amber-200 to-yellow-500" };
  if (score >= 10) return { emoji: "🥈", name: "Silver", ring: "from-slate-100 to-slate-400" };
  if (score >= 5) return { emoji: "🥉", name: "Bronze", ring: "from-orange-300 to-amber-600" };
  return null;
}

export function GameOverCard({
  score,
  best,
  rank,
  isBest,
  scores,
  highlightDate,
  onRestart,
  onMenu,
}: GameOverCardProps) {
  const medal = medalFor(score);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-[calc(var(--s)*20px)]">
      <div className="anim-drop flex flex-col items-center w-full max-w-[calc(var(--s)*300px)] rounded-3xl bg-[#121a38]/85 border border-white/12 backdrop-blur-md shadow-2xl shadow-black/50 px-[calc(var(--s)*18px)] py-[calc(var(--s)*18px)]">
        <h2
          className="font-black bg-gradient-to-b from-rose-200 to-orange-400 bg-clip-text text-transparent"
          style={{ fontSize: "calc(var(--s) * 34px)", lineHeight: 1 }}
        >
          Game Over
        </h2>

        {isBest && (
          <span
            className="anim-pop mt-[calc(var(--s)*8px)] rounded-full bg-amber-400 text-[#3a1d05] font-black uppercase tracking-wide"
            style={{
              fontSize: "calc(var(--s) * 11px)",
              padding: "calc(var(--s) * 4px) calc(var(--s) * 12px)",
              animationDelay: "200ms",
            }}
          >
            ★ New Best ★
          </span>
        )}

        <div className="mt-[calc(var(--s)*14px)] flex items-center gap-[calc(var(--s)*16px)]">
          {medal && (
            <div
              className={`anim-pop grid place-items-center rounded-full bg-gradient-to-b ${medal.ring} shadow-lg`}
              style={{
                width: "calc(var(--s) * 62px)",
                height: "calc(var(--s) * 62px)",
                fontSize: "calc(var(--s) * 30px)",
                animationDelay: "120ms",
              }}
              title={medal.name}
            >
              {medal.emoji}
            </div>
          )}

          <div className="flex flex-col items-start">
            <div className="flex items-baseline gap-[calc(var(--s)*10px)]">
              <span
                className="font-black text-white tabular-nums"
                style={{ fontSize: "calc(var(--s) * 44px)", lineHeight: 1 }}
              >
                {score}
              </span>
              <span
                className="font-bold text-white/50 uppercase"
                style={{ fontSize: "calc(var(--s) * 12px)" }}
              >
                pts
              </span>
            </div>
            <div
              className="mt-[calc(var(--s)*4px)] font-bold text-amber-200 tabular-nums"
              style={{ fontSize: "calc(var(--s) * 14px)" }}
            >
              🏆 Best {best}
              {rank > 0 && (
                <span className="text-white/50"> · Rank #{rank}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-[calc(var(--s)*16px)] w-full">
          <h3
            className="mb-[calc(var(--s)*6px)] font-extrabold uppercase tracking-widest text-white/45 text-center"
            style={{ fontSize: "calc(var(--s) * 10px)" }}
          >
            Top Scores
          </h3>
          <HighScoreTable scores={scores} highlightDate={highlightDate} />
        </div>

        <div className="mt-[calc(var(--s)*16px)] flex flex-col items-center gap-[calc(var(--s)*8px)]">
          <GameButton onClick={onRestart}>↻ &nbsp;Play Again</GameButton>
          <button
            data-ui
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onMenu}
            className="anim-pulse font-bold text-white/55 hover:text-white/80"
            style={{ fontSize: "calc(var(--s) * 12px)" }}
          >
            Space / tap to play again
          </button>
        </div>
      </div>
    </div>
  );
}

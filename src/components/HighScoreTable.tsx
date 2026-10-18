import type { HighScoreEntry } from "@/game/storage";

interface HighScoreTableProps {
  scores: HighScoreEntry[];
  highlightDate?: number;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function HighScoreTable({ scores, highlightDate }: HighScoreTableProps) {
  if (scores.length === 0) {
    return (
      <p
        className="text-white/50"
        style={{ fontSize: "calc(var(--s) * 12px)" }}
      >
        No scores yet — set the first record!
      </p>
    );
  }

  return (
    <ol className="w-full flex flex-col gap-[calc(var(--s)*4px)]">
      {scores.slice(0, 6).map((s, i) => {
        const isNew = highlightDate != null && s.date === highlightDate;
        return (
          <li
            key={s.date + "-" + i}
            className={
              "flex items-center justify-between rounded-lg px-[calc(var(--s)*10px)] font-bold tabular-nums " +
              (isNew
                ? "bg-amber-400/25 text-amber-100 ring-1 ring-amber-300/60"
                : "text-white/75")
            }
            style={{
              fontSize: "calc(var(--s) * 13px)",
              height: "calc(var(--s) * 26px)",
            }}
          >
            <span className="flex items-center gap-[calc(var(--s)*8px)]">
              <span
                className={
                  "grid place-items-center rounded-full font-black " +
                  (i === 0
                    ? "bg-amber-300 text-[#3a1d05]"
                    : i === 1
                      ? "bg-slate-200 text-[#333]"
                      : i === 2
                        ? "bg-orange-300 text-[#4a2408]"
                        : "bg-white/15 text-white/80")
                }
                style={{
                  width: "calc(var(--s) * 18px)",
                  height: "calc(var(--s) * 18px)",
                  fontSize: "calc(var(--s) * 11px)",
                }}
              >
                {i + 1}
              </span>
              {isNew && (
                <span
                  className="font-black uppercase tracking-wide text-amber-300"
                  style={{ fontSize: "calc(var(--s) * 10px)" }}
                >
                  new
                </span>
              )}
            </span>
            <span className="flex items-center gap-[calc(var(--s)*10px)]">
              <span
                className="text-white/40"
                style={{ fontSize: "calc(var(--s) * 10px)" }}
              >
                {formatDate(s.date)}
              </span>
              <span style={{ fontSize: "calc(var(--s) * 15px)" }}>
                {s.score}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

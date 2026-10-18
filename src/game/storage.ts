export interface HighScoreEntry {
  score: number;
  date: number;
}

const KEY = "flappy.sunset.highscores.v1";
const MAX = 10;

export function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (e): e is HighScoreEntry =>
          e && typeof e.score === "number" && Number.isFinite(e.score),
      )
      .sort((a, b) => b.score - a.score || a.date - b.date)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export interface SaveResult {
  list: HighScoreEntry[];
  rank: number; // 1-based, 0 if not in table
  isBest: boolean;
}

export function saveScore(score: number): SaveResult {
  const prev = loadHighScores();
  const prevBest = prev.length ? prev[0].score : 0;
  const entry: HighScoreEntry = { score, date: Date.now() };
  const next = [...prev, entry]
    .sort((a, b) => b.score - a.score || a.date - b.date)
    .slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  const idx = next.indexOf(entry);
  return { list: next, rank: idx >= 0 ? idx + 1 : 0, isBest: score > prevBest };
}

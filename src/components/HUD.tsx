import { IconButton } from "./ui";

interface HUDProps {
  muted: boolean;
  showPause: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
}

export function HUD({
  muted,
  showPause,
  onTogglePause,
  onToggleMute,
}: HUDProps) {
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-end px-[calc(var(--s)*14px)]"
      style={{ top: "calc(var(--s) * 12px)" }}
    >
      <div className="flex items-center gap-[calc(var(--s)*10px)]">
        <IconButton
          label={muted ? "Unmute (M)" : "Mute (M)"}
          onClick={onToggleMute}
        >
          {muted ? "🔇" : "🔊"}
        </IconButton>
        {showPause && (
          <IconButton label="Pause (P)" onClick={onTogglePause}>
            ❚❚
          </IconButton>
        )}
      </div>
    </div>
  );
}

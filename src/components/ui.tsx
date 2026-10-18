import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/utils/cn";

interface GameButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
}

const blurSelf = (e: MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.blur();
};

export function GameButton({
  children,
  onClick,
  variant = "primary",
  className,
}: GameButtonProps) {
  return (
    <button
      data-ui
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        blurSelf(e);
        onClick?.();
      }}
      className={cn(
        "select-none font-extrabold tracking-wide rounded-full transition-transform duration-100 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300/60",
        "shadow-lg shadow-black/30",
        variant === "primary"
          ? "bg-gradient-to-b from-amber-300 to-orange-500 text-[#3a1d05] hover:from-amber-200 hover:to-orange-400"
          : "bg-white/10 text-white/90 border border-white/20 hover:bg-white/20",
        className,
      )}
      style={{
        fontSize: "calc(var(--s) * 18px)",
        padding: "calc(var(--s) * 11px) calc(var(--s) * 26px)",
      }}
    >
      {children}
    </button>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

export function IconButton({ label, onClick, children }: IconButtonProps) {
  return (
    <button
      data-ui
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        blurSelf(e);
        onClick();
      }}
      className="grid place-items-center rounded-full bg-black/25 text-white/90 border border-white/15 backdrop-blur-sm transition hover:bg-black/40 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      style={{
        width: "calc(var(--s) * 40px)",
        height: "calc(var(--s) * 40px)",
        fontSize: "calc(var(--s) * 16px)",
      }}
    >
      {children}
    </button>
  );
}

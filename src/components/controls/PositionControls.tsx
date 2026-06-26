"use client";

import { PanelSection } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useEditor } from "@/state/editor-context";

export function PositionControls() {
  const { state, dispatch } = useEditor();
  const disabled = !state.image;

  // Nudge step scales with the canvas so it feels consistent at any resolution.
  const step = Math.max(5, Math.round(Math.min(state.output.width, state.output.height) * 0.01));
  const nudge = (dx: number, dy: number) =>
    dispatch({ type: "NUDGE", dx: dx * step, dy: dy * step });

  return (
    <PanelSection
      title="Position"
      action={
        <button
          disabled={disabled}
          onClick={() => dispatch({ type: "RESET" })}
          className="text-xs text-text-muted hover:text-text disabled:opacity-40"
        >
          Reset
        </button>
      }
    >
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          <span />
          <Arrow disabled={disabled} dir="up" onClick={() => nudge(0, -1)} />
          <span />
          <Arrow disabled={disabled} dir="left" onClick={() => nudge(-1, 0)} />
          <button
            disabled={disabled}
            onClick={() => dispatch({ type: "CENTER" })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-muted transition-colors hover:text-text disabled:opacity-40"
            aria-label="Center image"
          >
            <DotIcon />
          </button>
          <Arrow disabled={disabled} dir="right" onClick={() => nudge(1, 0)} />
          <span />
          <Arrow disabled={disabled} dir="down" onClick={() => nudge(0, 1)} />
          <span />
        </div>

        <div className="flex-1 space-y-2 text-xs text-text-muted">
          <p>Drag the image directly on the canvas, or nudge it here.</p>
          <Button
            size="sm"
            variant="subtle"
            disabled={disabled}
            className="w-full"
            onClick={() => dispatch({ type: "CENTER" })}
          >
            Center image
          </Button>
        </div>
      </div>
    </PanelSection>
  );
}

function Arrow({
  dir,
  onClick,
  disabled,
}: {
  dir: "up" | "down" | "left" | "right";
  onClick: () => void;
  disabled: boolean;
}) {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      aria-label={`Move ${dir}`}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-2 text-text-muted transition-colors hover:border-accent/50 hover:text-text disabled:opacity-40"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}

function DotIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

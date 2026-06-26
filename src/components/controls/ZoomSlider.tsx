"use client";

import { PanelSection } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useEditor } from "@/state/editor-context";
import { clampScale } from "@/lib/canvas-output";

const MIN = 0.05;
const MAX = 4;

export function ZoomSlider() {
  const { state, dispatch } = useEditor();
  const disabled = !state.image;
  const scale = state.transform.scale;
  const percent = Math.round(scale * 100);

  const setScale = (s: number) => dispatch({ type: "SET_SCALE", scale: s });

  return (
    <PanelSection
      title="Zoom & scale"
      action={
        <span className="text-xs tabular-nums text-text-muted">{percent}%</span>
      }
    >
      <div className="flex items-center gap-3">
        <button
          aria-label="Zoom out"
          disabled={disabled}
          onClick={() => setScale(clampScale(scale - 0.05))}
          className="text-text-muted hover:text-text disabled:opacity-40"
        >
          <MinusIcon />
        </button>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={0.01}
          value={scale}
          disabled={disabled}
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="flex-1"
        />
        <button
          aria-label="Zoom in"
          disabled={disabled}
          onClick={() => setScale(clampScale(scale + 0.05))}
          className="text-text-muted hover:text-text disabled:opacity-40"
        >
          <PlusIcon />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="subtle"
          disabled={disabled}
          onClick={() => setScale(1)}
        >
          100%
        </Button>
        <Button
          size="sm"
          variant="subtle"
          disabled={disabled}
          onClick={() => dispatch({ type: "FIT" })}
        >
          Fit
        </Button>
        <Button
          size="sm"
          variant="subtle"
          disabled={disabled}
          onClick={() => dispatch({ type: "FILL" })}
        >
          Fill
        </Button>
      </div>
    </PanelSection>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

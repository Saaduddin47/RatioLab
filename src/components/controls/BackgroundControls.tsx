"use client";

import { cn } from "@/lib/cn";
import { PanelSection } from "@/components/ui/Panel";
import { useEditor } from "@/state/editor-context";
import type { BackgroundKind } from "@/types/editor";

const SWATCHES = ["#ffffff", "#000000", "#0b0c10", "#f5f5f4", "#1e293b"];

export function BackgroundControls() {
  const { state, dispatch } = useEditor();
  const { background } = state;
  const disabled = !state.image;

  const setKind = (kind: BackgroundKind) =>
    dispatch({ type: "SET_BACKGROUND", background: { kind } });

  const options: { kind: BackgroundKind; label: string }[] = [
    { kind: "color", label: "Color" },
    { kind: "transparent", label: "Transparent" },
    { kind: "blur", label: "Blur" },
  ];

  return (
    <PanelSection title="Background">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.kind}
            disabled={disabled}
            onClick={() => setKind(opt.kind)}
            className={cn(
              "rounded-lg border px-2 py-2 text-xs font-medium transition-all disabled:opacity-40",
              background.kind === opt.kind
                ? "border-accent bg-accent/15 text-text"
                : "border-border bg-surface-2/50 text-text-muted hover:text-text",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {background.kind === "color" && (
        <div className="mt-3 flex items-center gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              disabled={disabled}
              onClick={() =>
                dispatch({ type: "SET_BACKGROUND", background: { color: c } })
              }
              aria-label={`Background ${c}`}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                background.color.toLowerCase() === c.toLowerCase()
                  ? "border-accent"
                  : "border-border",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="relative ml-auto h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 border-border">
            <input
              type="color"
              value={background.color}
              disabled={disabled}
              onChange={(e) =>
                dispatch({
                  type: "SET_BACKGROUND",
                  background: { color: e.target.value },
                })
              }
              className="absolute inset-0 h-[200%] w-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 p-0"
            />
          </label>
        </div>
      )}

      {background.kind === "transparent" && (
        <p className="mt-3 text-xs text-text-muted">
          Exports with a transparent background (PNG recommended).
        </p>
      )}

      {background.kind === "blur" && (
        <p className="mt-3 text-xs text-text-muted">
          Fills empty space with a blurred copy of your image.
        </p>
      )}
    </PanelSection>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PanelSection } from "@/components/ui/Panel";
import { useEditor } from "@/state/editor-context";
import {
  ASPECT_RATIO_PRESETS,
  CUSTOM_PRESET_ID,
  makeCustomPreset,
} from "@/lib/aspect-ratios";

export function AspectRatioSelector() {
  const { state, dispatch } = useEditor();
  const [customW, setCustomW] = useState("4");
  const [customH, setCustomH] = useState("3");

  const isCustom = state.preset.id === CUSTOM_PRESET_ID;

  const applyCustom = (w: string, h: string) => {
    const nw = parseFloat(w);
    const nh = parseFloat(h);
    if (!Number.isFinite(nw) || !Number.isFinite(nh) || nw <= 0 || nh <= 0) {
      return;
    }
    dispatch({ type: "SET_PRESET", preset: makeCustomPreset(nw, nh) });
  };

  return (
    <PanelSection title="Aspect ratio">
      <div className="grid grid-cols-3 gap-2">
        {ASPECT_RATIO_PRESETS.map((preset) => {
          const active = state.preset.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => dispatch({ type: "SET_PRESET", preset })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all",
                active
                  ? "border-accent bg-accent/15 text-text"
                  : "border-border bg-surface-2/50 text-text-muted hover:border-accent/50 hover:text-text",
              )}
            >
              <RatioGlyph w={preset.ratioW} h={preset.ratioH} active={active} />
              <span className="text-[11px] font-medium leading-none">
                {preset.label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => applyCustom(customW, customH)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all",
            isCustom
              ? "border-accent bg-accent/15 text-text"
              : "border-border bg-surface-2/50 text-text-muted hover:border-accent/50 hover:text-text",
          )}
        >
          <RatioGlyph w={3} h={3} active={isCustom} custom />
          <span className="text-[11px] font-medium leading-none">Custom</span>
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <NumberField
          label="W"
          value={customW}
          onChange={(v) => {
            setCustomW(v);
            applyCustom(v, customH);
          }}
        />
        <span className="text-text-muted">:</span>
        <NumberField
          label="H"
          value={customH}
          onChange={(v) => {
            setCustomH(v);
            applyCustom(customW, v);
          }}
        />
        <span className="ml-auto text-xs text-text-muted">
          {state.output.width} × {state.output.height}px
        </span>
      </div>
    </PanelSection>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-sm text-text outline-none focus:border-accent"
      />
    </label>
  );
}

function RatioGlyph({
  w,
  h,
  active,
  custom = false,
}: {
  w: number;
  h: number;
  active: boolean;
  custom?: boolean;
}) {
  const maxDim = 22;
  const ratio = w / h;
  const gw = ratio >= 1 ? maxDim : maxDim * ratio;
  const gh = ratio >= 1 ? maxDim / ratio : maxDim;
  return (
    <span
      className={cn(
        "flex items-center justify-center",
        active ? "text-accent" : "text-text-muted",
      )}
      style={{ width: maxDim, height: maxDim }}
    >
      <span
        className={cn(
          "rounded-[3px] border-2",
          active ? "border-accent" : "border-current",
          custom && "border-dashed",
        )}
        style={{ width: gw, height: gh }}
      />
    </span>
  );
}

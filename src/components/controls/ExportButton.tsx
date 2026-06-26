"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { useEditor } from "@/state/editor-context";
import {
  buildExportFileName,
  exportImage,
} from "@/lib/export";
import type { ExportFormat } from "@/types/editor";

export function ExportButton() {
  const { state } = useEditor();
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.95);
  const [busy, setBusy] = useState(false);
  const disabled = !state.image;

  const handleExport = async () => {
    if (!state.image) return;
    setBusy(true);
    try {
      const fileName = buildExportFileName(
        state.image.fileName,
        state.preset.id,
        format,
      );
      await exportImage(
        {
          output: state.output,
          image: state.image,
          transform: state.transform,
          background: state.background,
          generated: state.generated,
        },
        { format, quality },
        fileName,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(["png", "jpeg"] as ExportFormat[]).map((f) => (
          <button
            key={f}
            disabled={disabled}
            onClick={() => setFormat(f)}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium uppercase transition-all disabled:opacity-40",
              format === f
                ? "border-accent bg-accent/15 text-text"
                : "border-border bg-surface-2/50 text-text-muted hover:text-text",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {format === "jpeg" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>JPEG quality</span>
            <span className="tabular-nums">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.01}
            value={quality}
            disabled={disabled}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      <Button
        variant="primary"
        className="w-full"
        disabled={disabled || busy}
        onClick={handleExport}
      >
        <DownloadIcon />
        {busy ? "Exporting…" : `Download ${format.toUpperCase()}`}
      </Button>

      <p className="text-center text-[11px] text-text-muted">
        Exports at full {state.output.width} × {state.output.height}px — original
        quality preserved.
      </p>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

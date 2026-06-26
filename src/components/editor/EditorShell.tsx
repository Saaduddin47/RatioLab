"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor } from "@/state/editor-context";
import { computeDisplayMetrics, type DisplayMetrics } from "@/lib/canvas-output";
import { Dropzone } from "@/components/upload/Dropzone";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { AspectRatioSelector } from "@/components/controls/AspectRatioSelector";
import { ZoomSlider } from "@/components/controls/ZoomSlider";
import { PositionControls } from "@/components/controls/PositionControls";
import { BackgroundControls } from "@/components/controls/BackgroundControls";
import { ExportButton } from "@/components/controls/ExportButton";
import { AiExpandButton } from "@/components/controls/AiExpandButton";
import { Panel } from "@/components/ui/Panel";

export default function EditorShell() {
  const { state, dispatch } = useEditor();
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = stageAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0].contentRect;
      // Leave a little breathing room around the canvas.
      setAvailable({
        width: Math.max(0, box.width - 48),
        height: Math.max(0, box.height - 48),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display: DisplayMetrics =
    available.width > 0 && available.height > 0
      ? computeDisplayMetrics(state.output, available)
      : { width: 0, height: 0, scale: 1 };

  return (
    <div className="flex min-h-screen flex-col">
      <Header hasImage={!!state.image} />

      <main className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row">
        <div
          ref={stageAreaRef}
          className="relative flex min-h-[45vh] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-[#0e1016] lg:min-h-0"
        >
          {state.image ? (
            display.width > 0 && (
              <EditorCanvas
                image={state.image}
                output={state.output}
                transform={state.transform}
                background={state.background}
                display={display}
                generated={state.generated}
                onChange={(t) =>
                  dispatch({ type: "SET_TRANSFORM", transform: t })
                }
              />
            )
          ) : (
            <div className="w-full p-6">
              <Dropzone
                onImage={(image) => dispatch({ type: "SET_IMAGE", image })}
              />
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:w-[340px] xl:w-[360px]">
          <div className="scroll-slim flex flex-col gap-3 sm:gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <Panel className="space-y-5">
              <AspectRatioSelector />
            </Panel>
            <Panel className="space-y-5">
              <ZoomSlider />
              <div className="h-px bg-border" />
              <PositionControls />
            </Panel>
            <Panel>
              <BackgroundControls />
            </Panel>
            <Panel className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Export
              </h3>
              <ExportButton />
              <div className="h-px bg-border" />
              <AiExpandButton />
            </Panel>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Header({ hasImage }: { hasImage: boolean }) {
  const { dispatch } = useEditor();
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-surface/60 px-3 py-3 backdrop-blur sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-fuchsia-500 text-white">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-text">Reframe</p>
          <p className="hidden truncate text-[11px] text-text-muted sm:block">
            Aspect Ratio Studio
          </p>
        </div>
      </div>

      {hasImage && (
        <div className="flex shrink-0 items-center gap-2">
          <Dropzone
            compact
            onImage={(image) => dispatch({ type: "SET_IMAGE", image })}
          />
          <button
            onClick={() => dispatch({ type: "CLEAR_IMAGE" })}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
          >
            Clear
          </button>
        </div>
      )}
    </header>
  );
}

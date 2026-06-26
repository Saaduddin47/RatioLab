"use client";

import { cn } from "@/lib/cn";
import { useEditor } from "@/state/editor-context";
import { requestOutpaint } from "@/lib/pipeline/ai-stub";

/**
 * AI Expand entry point. Builds the model inputs from the current placement,
 * calls the outpainting route, and pushes the resulting generated layer into
 * state — which the canvas and exporter render automatically.
 */
export function AiExpandButton() {
  const { state, dispatch } = useEditor();
  const loading = state.aiStatus === "loading";
  const disabled = !state.image || loading;
  const hasFill = state.generated.length > 0;

  const handleClick = async () => {
    if (!state.image) return;
    dispatch({ type: "SET_AI_STATUS", status: "loading", message: null });
    const result = await requestOutpaint({
      output: state.output,
      image: state.image,
      transform: state.transform,
    });

    if (result.status === "ok") {
      dispatch({
        type: "SET_GENERATED",
        layers: result.layers,
        message: result.message,
      });
    } else {
      dispatch({
        type: "SET_AI_STATUS",
        status: result.status === "noop" ? "noop" : "error",
        message: result.message,
      });
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50",
          "border border-accent/40 bg-gradient-to-r from-accent/15 to-fuchsia-500/15 text-text hover:from-accent/25 hover:to-fuchsia-500/25",
        )}
      >
        {loading ? <Spinner /> : <SparkleIcon />}
        {loading ? "Expanding…" : hasFill ? "Regenerate AI fill" : "AI Expand"}
      </button>

      {hasFill && !loading && (
        <button
          onClick={() => dispatch({ type: "CLEAR_GENERATED" })}
          className="w-full text-center text-xs text-text-muted transition-colors hover:text-text"
        >
          Remove AI fill
        </button>
      )}

      <p
        className={cn(
          "text-center text-xs",
          state.aiStatus === "error" ? "text-red-400" : "text-text-muted",
        )}
      >
        {loading
          ? "Generating the surrounding area — this can take a few seconds."
          : state.aiMessage ??
            "Generatively fill the empty area around your image."}
      </p>
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-4 w-4 text-accent-hover" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.8 4.6L18.4 8.4 13.8 10.2 12 14.8 10.2 10.2 5.6 8.4 10.2 6.6 12 2z" />
      <path d="M18 14l.9 2.3 2.3.9-2.3.9L18 20.4l-.9-2.3-2.3-.9 2.3-.9L18 14z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  AspectRatioPreset,
  BackgroundConfig,
  ImageTransform,
  OutputSize,
  SourceImage,
} from "@/types/editor";
import type { GeneratedLayer } from "@/lib/pipeline/types";
import {
  ASPECT_RATIO_PRESETS,
  makeCustomPreset,
} from "@/lib/aspect-ratios";
import {
  centeredTransform,
  clampScale,
  computeOutputSize,
  fillScale,
  fitScale,
} from "@/lib/canvas-output";

export type AiStatus = "idle" | "loading" | "error" | "noop";

export interface EditorState {
  image: SourceImage | null;
  preset: AspectRatioPreset;
  output: OutputSize;
  transform: ImageTransform;
  background: BackgroundConfig;
  /** AI-generated outpainting layers (rendered behind the original image). */
  generated: GeneratedLayer[];
  aiStatus: AiStatus;
  aiMessage: string | null;
}

type Action =
  | { type: "SET_IMAGE"; image: SourceImage }
  | { type: "CLEAR_IMAGE" }
  | { type: "SET_PRESET"; preset: AspectRatioPreset }
  | { type: "SET_TRANSFORM"; transform: Partial<ImageTransform> }
  | { type: "SET_SCALE"; scale: number }
  | { type: "NUDGE"; dx: number; dy: number }
  | { type: "SET_BACKGROUND"; background: Partial<BackgroundConfig> }
  | { type: "CENTER" }
  | { type: "FIT" }
  | { type: "FILL" }
  | { type: "RESET" }
  | { type: "SET_AI_STATUS"; status: AiStatus; message?: string | null }
  | { type: "SET_GENERATED"; layers: GeneratedLayer[]; message?: string | null }
  | { type: "CLEAR_GENERATED" };

/**
 * Any geometry change (image, ratio, position, scale) invalidates a previous AI
 * fill, so we reset the generated layers alongside it. This is what keeps the
 * outpainting feature decoupled — nothing else has to know it existed.
 */
const CLEARED_AI: Pick<EditorState, "generated" | "aiStatus" | "aiMessage"> = {
  generated: [],
  aiStatus: "idle",
  aiMessage: null,
};

const DEFAULT_PRESET = ASPECT_RATIO_PRESETS[0];

const EMPTY_OUTPUT: OutputSize = { width: 1080, height: 1920 };

const initialState: EditorState = {
  image: null,
  preset: DEFAULT_PRESET,
  output: EMPTY_OUTPUT,
  transform: { x: 0, y: 0, scale: 1, rotation: 0 },
  background: { kind: "color", color: "#ffffff" },
  generated: [],
  aiStatus: "idle",
  aiMessage: null,
};

function recomputeForImage(
  image: SourceImage,
  preset: AspectRatioPreset,
): Pick<EditorState, "output" | "transform"> {
  const output = computeOutputSize(preset, image);
  const transform = centeredTransform(output, image, 1);
  return { output, transform };
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_IMAGE": {
      const { output, transform } = recomputeForImage(
        action.image,
        state.preset,
      );
      return { ...state, ...CLEARED_AI, image: action.image, output, transform };
    }

    case "CLEAR_IMAGE":
      return { ...initialState, preset: state.preset, background: state.background };

    case "SET_PRESET": {
      if (!state.image) {
        return { ...state, ...CLEARED_AI, preset: action.preset };
      }
      // Re-center at the current scale so the user's zoom is preserved across
      // ratio changes; the canvas is resized to keep the image lossless.
      const output = computeOutputSize(action.preset, state.image);
      const transform = centeredTransform(
        output,
        state.image,
        state.transform.scale,
      );
      return { ...state, ...CLEARED_AI, preset: action.preset, output, transform };
    }

    case "SET_TRANSFORM":
      return {
        ...state,
        ...CLEARED_AI,
        transform: { ...state.transform, ...action.transform },
      };

    case "SET_SCALE": {
      if (!state.image) return state;
      const newScale = clampScale(action.scale);
      // Scale around the canvas centre so zooming feels anchored.
      const { output, image } = state;
      const oldW = image.naturalWidth * state.transform.scale;
      const oldH = image.naturalHeight * state.transform.scale;
      const newW = image.naturalWidth * newScale;
      const newH = image.naturalHeight * newScale;
      const cx = state.transform.x + oldW / 2;
      const cy = state.transform.y + oldH / 2;
      return {
        ...state,
        ...CLEARED_AI,
        output,
        transform: {
          ...state.transform,
          scale: newScale,
          x: cx - newW / 2,
          y: cy - newH / 2,
        },
      };
    }

    case "NUDGE":
      return {
        ...state,
        ...CLEARED_AI,
        transform: {
          ...state.transform,
          x: state.transform.x + action.dx,
          y: state.transform.y + action.dy,
        },
      };

    case "SET_BACKGROUND":
      return {
        ...state,
        background: { ...state.background, ...action.background },
      };

    case "CENTER": {
      if (!state.image) return state;
      return {
        ...state,
        ...CLEARED_AI,
        transform: centeredTransform(
          state.output,
          state.image,
          state.transform.scale,
        ),
      };
    }

    case "FIT": {
      if (!state.image) return state;
      const scale = clampScale(fitScale(state.output, state.image));
      return {
        ...state,
        ...CLEARED_AI,
        transform: centeredTransform(state.output, state.image, scale),
      };
    }

    case "FILL": {
      if (!state.image) return state;
      const scale = clampScale(fillScale(state.output, state.image));
      return {
        ...state,
        ...CLEARED_AI,
        transform: centeredTransform(state.output, state.image, scale),
      };
    }

    case "RESET": {
      if (!state.image) return state;
      const { output, transform } = recomputeForImage(state.image, state.preset);
      return { ...state, ...CLEARED_AI, output, transform };
    }

    case "SET_AI_STATUS":
      return {
        ...state,
        aiStatus: action.status,
        aiMessage: action.message ?? state.aiMessage,
      };

    case "SET_GENERATED":
      return {
        ...state,
        generated: action.layers,
        aiStatus: "idle",
        aiMessage: action.message ?? null,
      };

    case "CLEAR_GENERATED":
      return { ...state, ...CLEARED_AI };

    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<Action>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditor must be used within an EditorProvider.");
  }
  return ctx;
}

export { makeCustomPreset };

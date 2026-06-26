import type { ImageTransform, OutputSize } from "@/types/editor";

/**
 * The render pipeline models the output canvas as an ordered list of layers.
 * Both the live preview and the export render from the SAME layer list, so the
 * exported pixels always match what the user sees.
 *
 * This is the seam for the future AI outpainting feature: a `GeneratedLayer`
 * can be inserted (typically behind the image, filling the empty regions)
 * without changing the editor or the exporter.
 */

export type LayerType = "background" | "image" | "generated";

interface BaseLayer {
  id: string;
  type: LayerType;
  /** Lower z renders first (further back). */
  z: number;
}

/** Solid / transparent fill that sits behind everything. */
export interface BackgroundLayer extends BaseLayer {
  type: "background";
  /** CSS color, or null for transparent. */
  color: string | null;
}

/** The user's original image, positioned in output space. */
export interface ImageLayer extends BaseLayer {
  type: "image";
  element: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
  transform: ImageTransform;
}

/**
 * RESERVED for AI outpainting. A generated layer carries pixels produced for a
 * specific region of the canvas (the area outside the original image). Not yet
 * produced by the app — the type exists so the pipeline is ready for it.
 */
export interface GeneratedLayer extends BaseLayer {
  type: "generated";
  element: HTMLImageElement | HTMLCanvasElement;
  /** Destination rectangle in output space. */
  rect: Rect;
  /** Provenance metadata for future debugging / re-generation. */
  source?: string;
}

export type Layer = BackgroundLayer | ImageLayer | GeneratedLayer;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A fully-resolved description of what to draw, in output space. */
export interface RenderPlan {
  output: OutputSize;
  layers: Layer[];
}

/**
 * Shared domain types for the editor.
 *
 * Coordinate spaces used across the app:
 * - "output space": pixel coordinates of the final exported canvas. This is the
 *   source of truth for every transform. It never depends on screen size.
 * - "display space": the on-screen, scaled-down representation of the output
 *   canvas. Derived from output space via `displayScale`.
 */

export type ImageFormat = "png" | "jpeg" | "webp";

/** A decoded source image kept at its full, natural resolution. */
export interface SourceImage {
  /** Full-resolution element. Source of truth for EXPORT (never downscaled). */
  element: HTMLImageElement;
  /**
   * High-quality, pre-downscaled copy used only for the on-screen editor.
   * Rendering a screen-sized copy avoids single-step downscale aliasing
   * (pixelation/shimmer) and keeps dragging fast. Equal to `element` for
   * images already small enough. NEVER used for export.
   */
  previewElement: HTMLImageElement | HTMLCanvasElement;
  /** Object URL backing the element; revoke on replace/unmount. */
  objectUrl: string;
  /** Natural (intrinsic) width in pixels. Never downscaled. */
  naturalWidth: number;
  /** Natural (intrinsic) height in pixels. Never downscaled. */
  naturalHeight: number;
  /** Original file name, used to derive export file names. */
  fileName: string;
}

/** Definition of a selectable target aspect ratio. */
export interface AspectRatioPreset {
  id: string;
  label: string;
  /** Width ratio unit (e.g. 9 for 9:16). */
  ratioW: number;
  /** Height ratio unit (e.g. 16 for 9:16). */
  ratioH: number;
  /** Optional grouping for the selector UI. */
  group?: "social" | "print" | "square" | "custom";
}

/** Transform of the image within the output canvas, in OUTPUT space. */
export interface ImageTransform {
  /** X offset of the image's top-left corner, in output pixels. */
  x: number;
  /** Y offset of the image's top-left corner, in output pixels. */
  y: number;
  /** Uniform scale applied to the natural image (1 = natural size). */
  scale: number;
  /** Rotation in degrees (reserved; UI keeps this at 0 for the MVP). */
  rotation: number;
}

export type BackgroundKind = "color" | "transparent" | "blur";

export interface BackgroundConfig {
  kind: BackgroundKind;
  /** CSS color used when kind === "color". */
  color: string;
}

/** The output canvas size in pixels (output space). */
export interface OutputSize {
  width: number;
  height: number;
}

export type ExportFormat = "png" | "jpeg";

export interface ExportOptions {
  format: ExportFormat;
  /** JPEG quality in [0, 1]. Ignored for PNG. */
  quality: number;
}

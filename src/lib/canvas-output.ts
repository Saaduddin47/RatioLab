import type {
  AspectRatioPreset,
  ImageTransform,
  OutputSize,
  SourceImage,
} from "@/types/editor";
import { ratioValue } from "@/lib/aspect-ratios";

/**
 * Compute the output (export) canvas size for a given aspect ratio.
 *
 * Core quality rule: the canvas must be large enough to contain the source
 * image at its NATURAL resolution (scale = 1) without upscaling. This is the
 * smallest canvas of the requested ratio that fully contains the image, so the
 * original pixels are preserved 1:1 and the export is never blurry.
 */
export function computeOutputSize(
  preset: AspectRatioPreset,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
): OutputSize {
  const r = ratioValue(preset); // width / height
  const { naturalWidth: w, naturalHeight: h } = image;

  const width = Math.round(Math.max(w, h * r));
  const height = Math.round(width / r);

  return { width, height };
}

export interface DisplayMetrics {
  /** On-screen width of the stage, in CSS pixels. */
  width: number;
  /** On-screen height of the stage, in CSS pixels. */
  height: number;
  /** displaySize / outputSize. Multiply output coords by this for the screen. */
  scale: number;
}

/**
 * Fit the output canvas inside an available viewport box while preserving the
 * aspect ratio. The returned `scale` converts output space -> display space.
 */
export function computeDisplayMetrics(
  output: OutputSize,
  available: { width: number; height: number },
): DisplayMetrics {
  const scale = Math.min(
    available.width / output.width,
    available.height / output.height,
    1, // never enlarge beyond 1:1 on screen; export still uses full res
  );

  return {
    width: Math.round(output.width * scale),
    height: Math.round(output.height * scale),
    scale,
  };
}

/**
 * Default transform: original image centred at natural size (scale = 1).
 * No cropping, no stretching, no upscaling — the surrounding area becomes the
 * new background (and, in the future, the AI-expanded region).
 */
export function centeredTransform(
  output: OutputSize,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
  scale = 1,
): ImageTransform {
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  return {
    x: (output.width - drawW) / 2,
    y: (output.height - drawH) / 2,
    scale,
    rotation: 0,
  };
}

/**
 * "Fit" scale: largest scale at which the whole image is visible within the
 * canvas. Because the canvas is sized to contain the natural image, this is
 * always >= 1; we expose it so the user can fill the frame if they want.
 */
export function fitScale(
  output: OutputSize,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
): number {
  return Math.min(
    output.width / image.naturalWidth,
    output.height / image.naturalHeight,
  );
}

/** "Fill" scale: smallest scale at which the image covers the whole canvas. */
export function fillScale(
  output: OutputSize,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
): number {
  return Math.max(
    output.width / image.naturalWidth,
    output.height / image.naturalHeight,
  );
}

/** Clamp a scale value to a sensible editing range. */
export function clampScale(scale: number, min = 0.05, max = 8): number {
  return Math.min(Math.max(scale, min), max);
}

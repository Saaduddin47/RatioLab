import type { ImageTransform, OutputSize, SourceImage } from "@/types/editor";
import { imageRect } from "@/lib/pipeline/regions";

/**
 * Client-side preparation of the inputs an inpainting model needs to outpaint
 * (extend) the image into the empty canvas border.
 *
 * Two images are produced, both in a model-friendly "working" resolution:
 *  - init image: the original placed on a black canvas (the model keeps the
 *    unmasked area and generates the rest).
 *  - mask: WHITE where the model should generate (the empty border), BLACK where
 *    the original must be preserved. The black "keep" rectangle is inset by a
 *    feather so the seam blends; the pristine original is later composited on
 *    top at full resolution, so the original quality is never degraded.
 */

export interface OutpaintInputs {
  /** Base64 PNG (no data-URL prefix) of the init image. */
  imageB64: string;
  /** Base64 PNG (no data-URL prefix) of the mask. */
  maskB64: string;
  /** Working resolution sent to the model. */
  width: number;
  height: number;
}

/** SD 1.5 behaves best at moderate sizes; never upscale beyond the output. */
const MAX_LONG_SIDE = 1024;
const MIN_SIDE = 256;

function roundTo(value: number, multiple: number): number {
  return Math.max(multiple, Math.round(value / multiple) * multiple);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Pick a model working resolution that matches the output aspect ratio, is a
 * multiple of 64 (SD requirement), and never exceeds the real output size.
 */
export function workingSize(output: OutputSize): { width: number; height: number } {
  const ratio = output.width / output.height;
  const longCap = Math.min(MAX_LONG_SIDE, Math.max(output.width, output.height));

  let w: number;
  let h: number;
  if (output.width >= output.height) {
    w = longCap;
    h = longCap / ratio;
  } else {
    h = longCap;
    w = longCap * ratio;
  }

  return {
    width: clamp(roundTo(w, 64), MIN_SIDE, MAX_LONG_SIDE),
    height: clamp(roundTo(h, 64), MIN_SIDE, MAX_LONG_SIDE),
  };
}

function toBase64Png(canvas: HTMLCanvasElement): string {
  const url = canvas.toDataURL("image/png");
  return url.slice(url.indexOf(",") + 1);
}

export function buildOutpaintInputs(
  output: OutputSize,
  image: SourceImage,
  transform: ImageTransform,
): OutpaintInputs {
  const { width: W, height: H } = workingSize(output);
  const sx = W / output.width;
  const sy = H / output.height;

  // --- init image -----------------------------------------------------------
  const init = document.createElement("canvas");
  init.width = W;
  init.height = H;
  const ictx = init.getContext("2d");
  if (!ictx) throw new Error("Could not create init canvas context.");
  ictx.imageSmoothingEnabled = true;
  ictx.imageSmoothingQuality = "high";

  // Seed the empty area with a blurred, cover-scaled copy of the image. This
  // gives the model a plausible BACKGROUND to refine instead of black pixels,
  // which (combined with a low denoise strength) stops it from inventing new
  // subjects like extra cars/people. For studio/gradient shots this blurred
  // base already reads as the backdrop.
  const coverScale = Math.max(
    W / image.naturalWidth,
    H / image.naturalHeight,
  );
  const cw = image.naturalWidth * coverScale;
  const ch = image.naturalHeight * coverScale;
  const blurPx = Math.max(12, Math.round(Math.min(W, H) * 0.06));
  ictx.save();
  ictx.filter = `blur(${blurPx}px)`;
  ictx.drawImage(image.element, (W - cw) / 2, (H - ch) / 2, cw, ch);
  ictx.restore();

  // Draw the sharp original at its real placement on top of the blurred base.
  ictx.drawImage(
    image.element,
    transform.x * sx,
    transform.y * sy,
    image.naturalWidth * transform.scale * sx,
    image.naturalHeight * transform.scale * sy,
  );

  // --- mask -----------------------------------------------------------------
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const mctx = mask.getContext("2d");
  if (!mctx) throw new Error("Could not create mask canvas context.");
  // Generate everywhere by default.
  mctx.fillStyle = "#ffffff";
  mctx.fillRect(0, 0, W, H);
  // Preserve the image area (inset by a feather so the seam is regenerated and blends).
  const r = imageRect(image, transform);
  const feather = Math.max(2, Math.round(Math.min(W, H) * 0.02));
  const bx = r.x * sx + feather;
  const by = r.y * sy + feather;
  const bw = r.width * sx - feather * 2;
  const bh = r.height * sy - feather * 2;
  if (bw > 0 && bh > 0) {
    mctx.fillStyle = "#000000";
    mctx.fillRect(bx, by, bw, bh);
  }

  return {
    imageB64: toBase64Png(init),
    maskB64: toBase64Png(mask),
    width: W,
    height: H,
  };
}

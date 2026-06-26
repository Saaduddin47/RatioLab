import type { ImageTransform, OutputSize, SourceImage } from "@/types/editor";
import type { Rect } from "@/lib/pipeline/types";

/**
 * Geometry of the placed image within the output canvas (output space).
 */
export function imageRect(
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
  transform: ImageTransform,
): Rect {
  return {
    x: transform.x,
    y: transform.y,
    width: image.naturalWidth * transform.scale,
    height: image.naturalHeight * transform.scale,
  };
}

/**
 * Compute the "empty" regions of the canvas — the areas around the placed image
 * that are currently filled by the background.
 *
 * This is intentionally the exact data an outpainting model needs: it describes
 * the pixels that should be generated to expand the image. Today it drives the
 * background fill; later it becomes the AI inpaint/outpaint mask, so the AI
 * feature reuses this computation instead of re-deriving it.
 *
 * Returns up to four rectangles (top, bottom, left, right) covering the gap.
 */
export function emptyRegions(
  output: OutputSize,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
  transform: ImageTransform,
): Rect[] {
  const img = imageRect(image, transform);

  // Visible portion of the image clipped to the canvas.
  const left = Math.max(0, img.x);
  const top = Math.max(0, img.y);
  const right = Math.min(output.width, img.x + img.width);
  const bottom = Math.min(output.height, img.y + img.height);

  // Image fully off-canvas -> the whole canvas is empty.
  if (right <= left || bottom <= top) {
    return [{ x: 0, y: 0, width: output.width, height: output.height }];
  }

  const regions: Rect[] = [];

  if (top > 0) {
    regions.push({ x: 0, y: 0, width: output.width, height: top });
  }
  if (bottom < output.height) {
    regions.push({
      x: 0,
      y: bottom,
      width: output.width,
      height: output.height - bottom,
    });
  }
  if (left > 0) {
    regions.push({ x: 0, y: top, width: left, height: bottom - top });
  }
  if (right < output.width) {
    regions.push({
      x: right,
      y: top,
      width: output.width - right,
      height: bottom - top,
    });
  }

  return regions;
}

/** True when the image already covers the entire canvas (no empty regions). */
export function coversCanvas(
  output: OutputSize,
  image: Pick<SourceImage, "naturalWidth" | "naturalHeight">,
  transform: ImageTransform,
): boolean {
  return emptyRegions(output, image, transform).length === 0;
}

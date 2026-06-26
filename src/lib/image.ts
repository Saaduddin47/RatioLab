import type { SourceImage } from "@/types/editor";

export const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;

/** Max file size we accept (50 MB). Large enough for high-res photos. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export interface ImageValidationError {
  code: "type" | "size" | "decode";
  message: string;
}

export function validateFile(file: File): ImageValidationError | null {
  const typeOk =
    (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) ||
    ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!typeOk) {
    return {
      code: "type",
      message: "Unsupported file type. Use PNG, JPG, JPEG, or WebP.",
    };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      code: "size",
      message: "File is too large. Maximum size is 50 MB.",
    };
  }

  return null;
}

/**
 * Decode a file into a full-resolution image element. We deliberately keep the
 * original bytes intact (no canvas round-trip) so the source is never
 * recompressed or downscaled before the user explicitly exports.
 */
export function decodeImageFile(file: File): Promise<SourceImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const element = new Image();

    element.onload = () => {
      resolve({
        element,
        previewElement: createPreviewSource(element),
        objectUrl,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        fileName: file.name,
      });
    };

    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject({
        code: "decode",
        message: "Could not read this image. The file may be corrupt.",
      } satisfies ImageValidationError);
    };

    element.src = objectUrl;
  });
}

/** Strip the extension from a file name, for building export names. */
export function baseFileName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

/**
 * Longest edge (in px) of the preview copy used in the editor. Large enough to
 * stay crisp on hi-DPI screens and when zooming in, small enough that the
 * downscale from source is high quality and dragging is smooth.
 */
export const PREVIEW_MAX_LONG_SIDE = 2560;

/**
 * Produce a high-quality, screen-sized copy of the image for the editor.
 *
 * Browsers downscale by a large factor poorly in a single `drawImage` step
 * (aliasing / "tearing" / pixelation). We instead halve the image repeatedly
 * with high-quality smoothing, which mimics mipmapping and yields a clean
 * preview. The full-resolution element is kept untouched for export.
 */
export function createPreviewSource(
  element: HTMLImageElement,
  maxLongSide = PREVIEW_MAX_LONG_SIDE,
): HTMLImageElement | HTMLCanvasElement {
  const longSide = Math.max(element.naturalWidth, element.naturalHeight);
  if (longSide <= maxLongSide) return element;

  let src: HTMLImageElement | HTMLCanvasElement = element;
  let curW = element.naturalWidth;
  let curH = element.naturalHeight;

  // Repeatedly halve until one more halving would pass the target.
  while (Math.max(curW, curH) > maxLongSide * 2) {
    const nw = Math.max(1, Math.round(curW / 2));
    const nh = Math.max(1, Math.round(curH / 2));
    src = drawScaled(src, nw, nh);
    curW = nw;
    curH = nh;
  }

  const scale = maxLongSide / Math.max(curW, curH);
  return drawScaled(src, Math.round(curW * scale), Math.round(curH * scale));
}

function drawScaled(
  source: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create preview canvas context.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

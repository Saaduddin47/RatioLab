import type { ExportOptions } from "@/types/editor";
import type { ComposeInput } from "@/lib/pipeline/compose";
import { compose } from "@/lib/pipeline/compose";
import { baseFileName } from "@/lib/image";

/**
 * Rasterise the render plan to a canvas at FULL output resolution.
 *
 * This is the heart of the "no quality loss" guarantee: we draw the original
 * image element (natural pixels) directly onto an output-sized canvas using the
 * transform in output space. There is no intermediate downscale, so the only
 * resampling that ever happens is the user's explicit scale.
 */
export function rasterize(input: ComposeInput): HTMLCanvasElement {
  const { output } = input;
  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D canvas context.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Background: blur is handled specially because it needs the source pixels.
  if (input.background.kind === "blur") {
    drawBlurredCover(ctx, input);
  } else if (input.background.kind === "color") {
    ctx.fillStyle = input.background.color;
    ctx.fillRect(0, 0, output.width, output.height);
  }
  // "transparent" -> leave the canvas cleared.

  const plan = compose(input);
  for (const layer of plan.layers) {
    if (layer.type === "generated") {
      ctx.drawImage(
        layer.element,
        layer.rect.x,
        layer.rect.y,
        layer.rect.width,
        layer.rect.height,
      );
    } else if (layer.type === "image") {
      const { transform } = layer;
      ctx.save();
      const cx = transform.x + (layer.naturalWidth * transform.scale) / 2;
      const cy = transform.y + (layer.naturalHeight * transform.scale) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.drawImage(
        layer.element,
        -(layer.naturalWidth * transform.scale) / 2,
        -(layer.naturalHeight * transform.scale) / 2,
        layer.naturalWidth * transform.scale,
        layer.naturalHeight * transform.scale,
      );
      ctx.restore();
    }
  }

  return canvas;
}

/** Draw the source image scaled to cover the whole canvas, heavily blurred. */
function drawBlurredCover(
  ctx: CanvasRenderingContext2D,
  input: ComposeInput,
): void {
  const { output, image } = input;
  const cover = Math.max(
    output.width / image.naturalWidth,
    output.height / image.naturalHeight,
  );
  const w = image.naturalWidth * cover;
  const h = image.naturalHeight * cover;
  const x = (output.width - w) / 2;
  const y = (output.height - h) / 2;

  ctx.save();
  // Blur radius scales with canvas size so it looks consistent at any export size.
  const radius = Math.max(8, Math.round(Math.min(output.width, output.height) * 0.04));
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(image.element, x, y, w, h);
  ctx.restore();
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  options: ExportOptions,
): Promise<Blob> {
  const mime = options.format === "png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Export failed: empty canvas output."));
      },
      mime,
      options.format === "jpeg" ? options.quality : undefined,
    );
  });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportFileName(
  originalName: string,
  ratioId: string,
  format: ExportOptions["format"],
): string {
  const base = baseFileName(originalName) || "image";
  const safeRatio = ratioId.replace(/[^a-z0-9]+/gi, "-");
  const ext = format === "png" ? "png" : "jpg";
  return `${base}-${safeRatio}.${ext}`;
}

/** Convenience: rasterize + encode + download in one call. */
export async function exportImage(
  input: ComposeInput,
  options: ExportOptions,
  fileName: string,
): Promise<void> {
  const canvas = rasterize(input);
  const blob = await canvasToBlob(canvas, options);
  downloadBlob(blob, fileName);
}

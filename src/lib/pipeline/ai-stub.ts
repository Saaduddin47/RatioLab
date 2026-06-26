import type { OutputSize, SourceImage, ImageTransform } from "@/types/editor";
import type { GeneratedLayer } from "@/lib/pipeline/types";
import { emptyRegions } from "@/lib/pipeline/regions";
import { buildOutpaintInputs } from "@/lib/pipeline/outpaint";

/**
 * AI outpainting ("AI Expand") integration.
 *
 * This module is the single seam between the editor and the generative model.
 * It builds the model inputs (init image + mask) from the SAME geometry the
 * pipeline already uses (`emptyRegions`), calls the server route that talks to
 * Cloudflare Workers AI, and returns a `GeneratedLayer` that the existing
 * `compose()` renders behind the original image — so both the live preview and
 * the export pick it up with no further changes.
 *
 * Swapping providers later means changing only `/api/outpaint`.
 */

export interface OutpaintRequest {
  output: OutputSize;
  image: SourceImage;
  transform: ImageTransform;
  /** Optional text prompt to steer generation. Unused for pure automatic fill. */
  prompt?: string;
}

export interface OutpaintResult {
  status: "ok" | "noop" | "error";
  message: string;
  layers: GeneratedLayer[];
}

export const AI_EXPAND_ENABLED = true;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load generated image."));
    img.src = url;
  });
}

export async function requestOutpaint(
  req: OutpaintRequest,
): Promise<OutpaintResult> {
  const regions = emptyRegions(req.output, req.image, req.transform);
  if (regions.length === 0) {
    return {
      status: "noop",
      message: "The image already fills the canvas — nothing to expand.",
      layers: [],
    };
  }

  const inputs = buildOutpaintInputs(req.output, req.image, req.transform);

  let res: Response;
  try {
    res = await fetch("/api/outpaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
  } catch {
    return {
      status: "error",
      message: "Could not reach the AI service. Check your connection.",
      layers: [],
    };
  }

  if (!res.ok) {
    let message = `AI Expand failed (${res.status}).`;
    try {
      const json = await res.json();
      if (json?.error) message = json.error as string;
    } catch {
      /* keep default */
    }
    return { status: "error", message, layers: [] };
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const element = await loadImage(url);

  // The generated fill covers the whole canvas but sits BEHIND the original
  // image (z handled by compose), so the user's pixels stay pristine.
  const layer: GeneratedLayer = {
    id: `generated-${Date.now()}`,
    type: "generated",
    z: 1,
    element,
    rect: { x: 0, y: 0, width: req.output.width, height: req.output.height },
    source: "cloudflare:sd-1.5-inpainting",
  };

  return {
    status: "ok",
    message: "AI Expand complete.",
    layers: [layer],
  };
}

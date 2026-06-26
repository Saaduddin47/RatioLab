import type {
  BackgroundConfig,
  ImageTransform,
  OutputSize,
  SourceImage,
} from "@/types/editor";
import type {
  BackgroundLayer,
  ImageLayer,
  Layer,
  RenderPlan,
} from "@/lib/pipeline/types";

export interface ComposeInput {
  output: OutputSize;
  image: SourceImage;
  transform: ImageTransform;
  background: BackgroundConfig;
  /**
   * Future AI-generated layers. Today this is always empty; the AI feature will
   * populate it and everything downstream (preview + export) keeps working.
   */
  generated?: Layer[];
}

/**
 * Pure function that turns editor state into an ordered render plan.
 *
 * Order (back -> front):
 *   1. background fill
 *   2. AI-generated regions (reserved, currently none)
 *   3. the original image
 *
 * Keeping this pure and shared is what makes the AI feature a drop-in later:
 * insert generated layers and both renderers pick them up automatically.
 */
export function compose(input: ComposeInput): RenderPlan {
  const { output, image, transform, background, generated = [] } = input;

  const layers: Layer[] = [];

  const backgroundLayer: BackgroundLayer = {
    id: "background",
    type: "background",
    z: 0,
    color: background.kind === "transparent" ? null : background.color,
  };
  layers.push(backgroundLayer);

  // Reserved seam: AI-generated fill sits above the background but below the
  // original image so the user's pixels are never covered.
  generated.forEach((layer, i) => {
    layers.push({ ...layer, z: 1 + i });
  });

  const imageLayer: ImageLayer = {
    id: "source-image",
    type: "image",
    z: 1000,
    element: image.element,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    transform,
  };
  layers.push(imageLayer);

  layers.sort((a, b) => a.z - b.z);

  return { output, layers };
}

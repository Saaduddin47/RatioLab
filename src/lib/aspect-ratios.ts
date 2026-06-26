import type { AspectRatioPreset } from "@/types/editor";

/**
 * A4 is 210mm x 297mm. We express it as an integer-ish ratio so the rest of the
 * pipeline can treat it identically to social ratios.
 */
const A4_W = 2100;
const A4_H = 2970;

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: "9:16", label: "9 : 16", ratioW: 9, ratioH: 16, group: "social" },
  { id: "16:9", label: "16 : 9", ratioW: 16, ratioH: 9, group: "social" },
  { id: "4:5", label: "4 : 5", ratioW: 4, ratioH: 5, group: "social" },
  { id: "1:1", label: "1 : 1", ratioW: 1, ratioH: 1, group: "square" },
  { id: "a4-portrait", label: "A4 Portrait", ratioW: A4_W, ratioH: A4_H, group: "print" },
  { id: "a4-landscape", label: "A4 Landscape", ratioW: A4_H, ratioH: A4_W, group: "print" },
];

export const CUSTOM_PRESET_ID = "custom";

export function getPresetById(id: string): AspectRatioPreset | undefined {
  return ASPECT_RATIO_PRESETS.find((p) => p.id === id);
}

/** Normalised aspect ratio (width / height) for a preset. */
export function ratioValue(preset: AspectRatioPreset): number {
  return preset.ratioW / preset.ratioH;
}

/** Build a custom preset from raw width/height ratio inputs. */
export function makeCustomPreset(ratioW: number, ratioH: number): AspectRatioPreset {
  return {
    id: CUSTOM_PRESET_ID,
    label: "Custom",
    ratioW: Math.max(ratioW, 0.0001),
    ratioH: Math.max(ratioH, 0.0001),
    group: "custom",
  };
}

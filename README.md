# Reframe — Aspect Ratio Studio

A modern, responsive web app that converts images between aspect ratios **without reducing quality, compressing, stretching, or cropping** the original. The image is placed on a new canvas matching your chosen aspect ratio, and you reposition and scale it manually.

## Features

- Drag-and-drop upload (PNG, JPG, JPEG, WebP, up to 50 MB)
- Interactive Konva canvas: drag, reposition, and scale the image
- Aspect ratio presets: 9:16, 16:9, 4:5, 1:1, A4 Portrait, A4 Landscape, and Custom
- Background options: solid color, transparent, or blurred copy
- Live WYSIWYG preview
- Zoom slider with 100% / Fit / Fill, directional nudge, and center controls
- Lossless export: full-resolution PNG or high-quality JPEG
- Responsive desktop and mobile layout
- "AI Expand" placeholder for a future outpainting feature

## Quality guarantee

The decoded image is kept at its natural resolution and is the single source of truth. The output canvas is sized to fully contain the image at scale 1, so the original pixels are never upscaled. Export rasterizes at the full output resolution — PNG is lossless, JPEG defaults to 95% quality.

## Tech stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Konva](https://konvajs.org/) + [react-konva](https://konvajs.org/docs/react/) for the editor

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
```

## Project structure

```
src/
  app/                     Next.js App Router shell (client-only editor mount)
  components/
    controls/              Aspect ratio, zoom, position, background, export, AI
    editor/                EditorShell (layout) + EditorCanvas (Konva)
    ui/                    Reusable primitives (Button, Panel)
    upload/                Drag-and-drop Dropzone
  lib/
    aspect-ratios.ts       Presets + custom ratio helpers
    canvas-output.ts       Output sizing + display-scale math (lossless)
    export.ts              Full-resolution rasterize + download
    image.ts               File validation + decode
    pipeline/              Future-ready compositing pipeline
      types.ts             Layer model (background | image | generated)
      compose.ts           Pure state -> render plan
      regions.ts           Empty-region geometry (reused as AI mask later)
      ai-stub.ts           AI Expand seam (no-op placeholder)
  state/
    editor-context.tsx     Context + reducer (image, ratio, transform, bg)
  types/
    editor.ts              Shared domain types
```

## Future-ready AI outpainting

The render pipeline composes an ordered list of layers
(`background -> generated -> image`). The empty regions around the image are
already computed in `lib/pipeline/regions.ts` — exactly the data an outpainting
model needs. Wiring in real generation only requires implementing
`requestOutpaint` in `lib/pipeline/ai-stub.ts` to return `GeneratedLayer`s; the
preview and exporter pick them up with no further changes.

## Notes

- Konva runs client-only. The editor is loaded via `next/dynamic` with
  `ssr: false`, and `next.config.ts` marks `canvas` as a webpack external.

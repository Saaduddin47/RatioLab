"use client";

import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Rect, Image as KonvaImage, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type {
  BackgroundConfig,
  ImageTransform,
  OutputSize,
  SourceImage,
} from "@/types/editor";
import type { GeneratedLayer } from "@/lib/pipeline/types";
import type { DisplayMetrics } from "@/lib/canvas-output";

interface EditorCanvasProps {
  image: SourceImage;
  output: OutputSize;
  transform: ImageTransform;
  background: BackgroundConfig;
  display: DisplayMetrics;
  generated?: GeneratedLayer[];
  onChange: (next: Partial<ImageTransform>) => void;
}

const SNAP_THRESHOLD_PX = 8; // in output space

export function EditorCanvas({
  image,
  output,
  transform,
  background,
  display,
  generated = [],
  onChange,
}: EditorCanvasProps) {
  const [dragging, setDragging] = useState(false);
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({
    v: false,
    h: false,
  });

  const drawW = image.naturalWidth * transform.scale;
  const drawH = image.naturalHeight * transform.scale;

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let x = node.x();
    let y = node.y();

    // Snap to canvas center.
    const centerX = (output.width - drawW) / 2;
    const centerY = (output.height - drawH) / 2;
    const snapV = Math.abs(x - centerX) < SNAP_THRESHOLD_PX / display.scale;
    const snapH = Math.abs(y - centerY) < SNAP_THRESHOLD_PX / display.scale;
    if (snapV) {
      x = centerX;
      node.x(x);
    }
    if (snapH) {
      y = centerY;
      node.y(y);
    }
    setGuides({ v: snapV, h: snapH });
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    setDragging(false);
    setGuides({ v: false, h: false });
    onChange({ x: e.target.x(), y: e.target.y() });
  };

  return (
    <div
      className="checkerboard overflow-hidden rounded-xl shadow-2xl ring-1 ring-black/40"
      style={{ width: display.width, height: display.height }}
    >
      <Stage
        width={display.width}
        height={display.height}
        scaleX={display.scale}
        scaleY={display.scale}
      >
        <Layer>
          {background.kind === "color" && (
            <Rect
              x={0}
              y={0}
              width={output.width}
              height={output.height}
              fill={background.color}
              listening={false}
            />
          )}
          {background.kind === "blur" && (
            <BlurBackground
              image={image}
              output={output}
              pixelRatio={display.scale}
            />
          )}

          {/* AI-generated outpainting sits above the background but below the
              original image, so the user's pixels are never covered. */}
          {generated.map((layer) => (
            <KonvaImage
              key={layer.id}
              image={layer.element}
              x={layer.rect.x}
              y={layer.rect.y}
              width={layer.rect.width}
              height={layer.rect.height}
              listening={false}
              perfectDrawEnabled={false}
            />
          ))}
        </Layer>

        <Layer>
          <KonvaImage
            image={image.previewElement}
            x={transform.x}
            y={transform.y}
            width={drawW}
            height={drawH}
            rotation={transform.rotation}
            draggable
            onDragStart={() => setDragging(true)}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            perfectDrawEnabled={false}
            shadowForStrokeEnabled={false}
          />
        </Layer>

        {(dragging || guides.v || guides.h) && (
          <Layer listening={false}>
            {guides.v && (
              <Line
                points={[output.width / 2, 0, output.width / 2, output.height]}
                stroke="#6366f1"
                strokeWidth={1 / display.scale}
                dash={[6 / display.scale, 6 / display.scale]}
              />
            )}
            {guides.h && (
              <Line
                points={[0, output.height / 2, output.width, output.height / 2]}
                stroke="#6366f1"
                strokeWidth={1 / display.scale}
                dash={[6 / display.scale, 6 / display.scale]}
              />
            )}
          </Layer>
        )}
      </Stage>
    </div>
  );
}

/**
 * Real blurred-cover background using a Konva filter. We cache at the display
 * pixel ratio (not full output resolution) so large images stay performant
 * while the preview still matches the exporter's blurred background.
 */
function BlurBackground({
  image,
  output,
  pixelRatio,
}: {
  image: SourceImage;
  output: OutputSize;
  pixelRatio: number;
}) {
  const ref = useRef<Konva.Image>(null);

  const cover = Math.max(
    output.width / image.naturalWidth,
    output.height / image.naturalHeight,
  );
  const w = image.naturalWidth * cover;
  const h = image.naturalHeight * cover;
  const x = (output.width - w) / 2;
  const y = (output.height - h) / 2;
  const blurRadius = Math.max(8, Math.round(Math.min(output.width, output.height) * 0.04));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    node.cache({ pixelRatio: Math.min(Math.max(pixelRatio, 0.1), 1) });
    node.getLayer()?.batchDraw();
  }, [image, output.width, output.height, cover, blurRadius, pixelRatio]);

  return (
    <KonvaImage
      ref={ref}
      image={image.previewElement}
      x={x}
      y={y}
      width={w}
      height={h}
      filters={[Konva.Filters.Blur]}
      blurRadius={blurRadius}
      listening={false}
    />
  );
}

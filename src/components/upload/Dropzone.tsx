"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  ACCEPTED_EXTENSIONS,
  decodeImageFile,
  validateFile,
} from "@/lib/image";
import type { SourceImage } from "@/types/editor";

interface DropzoneProps {
  onImage: (image: SourceImage) => void;
  /** Compact variant for re-upload inside the toolbar. */
  compact?: boolean;
}

export function Dropzone({ onImage, compact = false }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError.message);
        return;
      }

      setError(null);
      setBusy(true);
      try {
        const image = await decodeImageFile(file);
        onImage(image);
      } catch {
        setError("Could not read this image. The file may be corrupt.");
      } finally {
        setBusy(false);
      }
    },
    [onImage],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const accept = ACCEPTED_EXTENSIONS.join(",");

  if (compact) {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text transition-colors hover:bg-[#232733]"
        >
          <UploadIcon className="h-4 w-4" />
          Replace image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center",
          "rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-all",
          dragging
            ? "border-accent bg-accent/10 scale-[1.01]"
            : "border-border bg-surface/60 hover:border-accent/60 hover:bg-surface",
        )}
      >
        <div
          className={cn(
            "mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
            dragging
              ? "bg-accent text-white"
              : "bg-surface-2 text-accent group-hover:bg-accent/20",
          )}
        >
          {busy ? (
            <Spinner className="h-7 w-7" />
          ) : (
            <UploadIcon className="h-7 w-7" />
          )}
        </div>

        <p className="text-lg font-semibold text-text">
          {busy ? "Reading image…" : "Drag & drop your image here"}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          or <span className="text-accent">browse files</span> — PNG, JPG, JPEG,
          WebP up to 50 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {error && (
        <p className="mt-3 text-center text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

"use client";

import dynamic from "next/dynamic";
import { EditorProvider } from "@/state/editor-context";

/**
 * The editor relies on Konva, which must run only on the client. We load the
 * whole editor shell with ssr disabled (see next.config.ts for the matching
 * `canvas` external) so Next never tries to render the canvas on the server.
 */
const EditorShell = dynamic(
  () => import("@/components/editor/EditorShell"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center text-text-muted">
        Loading studio…
      </div>
    ),
  },
);

export default function Home() {
  return (
    <EditorProvider>
      <EditorShell />
    </EditorProvider>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

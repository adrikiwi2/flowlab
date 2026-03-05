"use client";

import { Sparkles } from "lucide-react";
import type { InferenceResult, Category } from "@/lib/types";

interface AiResultCardProps {
  result: InferenceResult;
  categories: Category[];
}

export function AiResultCard({ result, categories }: AiResultCardProps) {
  const matchedCategory = categories.find(
    (c) => c.name === result.detected_status
  );
  const statusColor = matchedCategory?.color || "#6366f1";

  const extractedEntries = Object.entries(result.extracted_info || {}).filter(
    ([, v]) => v != null
  );

  return (
    <div className="animate-slide-up mx-auto w-full max-w-[90%] my-3">
      <div className="relative overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-accent/10 via-violet/8 to-accent/5">
        {/* Glow effect */}
        <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-accent/20 via-transparent to-violet/20 blur-sm" />

        {/* Scan line animation */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
          <div
            className="h-8 w-full bg-gradient-to-b from-transparent via-accent/5 to-transparent"
            style={{ animation: "scan-line 3s ease-in-out infinite" }}
          />
        </div>

        <div className="relative p-4">
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/20">
              <Sparkles size={13} className="text-accent" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              AI Router Decision
            </span>
          </div>

          {/* Status */}
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}60`,
              }}
            />
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: statusColor }}
            >
              {result.detected_status}
            </span>
          </div>

          {/* Reasoning */}
          <p className="mb-3 text-xs leading-relaxed text-text-secondary">
            {result.reasoning}
          </p>

          {/* Extracted info */}
          {extractedEntries.length > 0 && (
            <div className="space-y-1.5 border-t border-accent/10 pt-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Extracted
              </span>
              {extractedEntries.map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-text-muted">
                    {key}:
                  </span>
                  <span className="font-mono text-[11px] text-accent">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

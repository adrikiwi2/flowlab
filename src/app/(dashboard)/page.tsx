"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  GitBranch,
  MessageSquare,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { Flow } from "@/lib/types";

type FlowSummary = Flow & {
  category_count: number;
  simulation_count: number;
};

export default function Dashboard() {
  const [flows, setFlows] = useState<FlowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/flows")
      .then((r) => r.json())
      .then((data) => {
        setFlows(data);
        setLoading(false);
      });
  }, []);

  const createFlow = async () => {
    const res = await fetch("/api/flows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Flow" }),
    });
    const flow = await res.json();
    router.push(`/flow/${flow.id}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-5xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Flows
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Design conversation routing logic and test it with simulated
          dialogues.
        </p>
      </div>

      {flows.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-bright bg-base-1/50 px-8 py-16">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
            <GitBranch size={24} className="text-accent" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-text-primary">
            No flows yet
          </h2>
          <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
            Create your first conversation flow to start defining categories,
            testing simulations, and tuning your AI router.
          </p>
          <button
            onClick={createFlow}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dim hover:shadow-lg hover:shadow-accent/20"
          >
            <Plus size={16} />
            Create your first flow
          </button>
        </div>
      ) : (
        /* Flow grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow, i) => (
            <button
              key={flow.id}
              onClick={() => router.push(`/flow/${flow.id}`)}
              className="animate-slide-up group relative flex flex-col rounded-xl border border-border bg-base-1 p-5 text-left transition-all hover:border-border-bright hover:bg-base-2 hover:shadow-lg hover:shadow-accent/5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <GitBranch size={15} className="text-accent" />
                </div>
                <h3 className="truncate text-sm font-semibold text-text-primary">
                  {flow.name}
                </h3>
              </div>

              {flow.description && (
                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                  {flow.description}
                </p>
              )}

              <div className="mt-auto flex items-center gap-4 pt-2 text-text-muted">
                <span className="flex items-center gap-1 text-[11px]">
                  <Layers size={11} />
                  {flow.category_count}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <MessageSquare size={11} />
                  {flow.simulation_count}
                </span>
                <ArrowRight
                  size={13}
                  className="ml-auto text-transparent transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </div>
            </button>
          ))}

          {/* Create card */}
          <button
            onClick={createFlow}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-bright bg-base-1/30 p-5 transition-all hover:border-accent/40 hover:bg-accent-glow"
          >
            <Plus size={20} className="mb-1 text-text-muted" />
            <span className="text-xs font-medium text-text-muted">
              New Flow
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

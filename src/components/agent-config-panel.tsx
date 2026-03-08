"use client";

import { Bot, ArrowRight, Flag, ShieldAlert, Zap } from "lucide-react";

interface PolicyRule {
  when: Record<string, unknown>;
  then: Record<string, unknown>;
}

interface AgentConfig {
  channel?: string;
  mode?: string;
  stages?: string[];
  initial_stage?: string;
  flags?: string[];
  policy_rules?: PolicyRule[];
  max_interactions?: number;
  confidence_threshold?: number;
}

export function AgentConfigPanel({ configJson }: { configJson: string }) {
  let config: AgentConfig;
  try {
    config = JSON.parse(configJson);
  } catch {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger">
        Invalid agent_config JSON
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot size={14} className="text-accent" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          Agent Configuration
        </span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-medium text-accent">
          read-only
        </span>
      </div>

      {/* Channel & Mode */}
      {(config.channel || config.mode) && (
        <div className="flex gap-3">
          {config.channel && (
            <div className="rounded-lg border border-border bg-base-1 px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                Channel
              </span>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {config.channel}
              </p>
            </div>
          )}
          {config.mode && (
            <div className="rounded-lg border border-border bg-base-1 px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                Mode
              </span>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {config.mode}
              </p>
            </div>
          )}
          {config.max_interactions != null && (
            <div className="rounded-lg border border-border bg-base-1 px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                Max interactions
              </span>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {config.max_interactions}
              </p>
            </div>
          )}
          {config.confidence_threshold != null && (
            <div className="rounded-lg border border-border bg-base-1 px-3 py-2">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
                Confidence threshold
              </span>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {config.confidence_threshold}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stages pipeline */}
      {config.stages && config.stages.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Zap size={11} className="text-text-muted" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
              Stages
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {config.stages.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1">
                <span
                  className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-medium ${
                    stage === config.initial_stage
                      ? "border border-accent/30 bg-accent/10 text-accent"
                      : stage === "needs_human"
                        ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border border-border bg-base-1 text-text-secondary"
                  }`}
                >
                  {stage}
                </span>
                {i < config.stages!.length - 1 && (
                  <ArrowRight size={10} className="text-text-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags */}
      {config.flags && config.flags.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Flag size={11} className="text-text-muted" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
              Tracked flags
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {config.flags.map((flag) => (
              <span
                key={flag}
                className="rounded-md border border-border bg-base-1 px-2 py-1 font-mono text-[11px] text-text-secondary"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Policy rules */}
      {config.policy_rules && config.policy_rules.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <ShieldAlert size={11} className="text-text-muted" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
              Policy rules
            </span>
          </div>
          <div className="space-y-1.5">
            {config.policy_rules.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border bg-base-1 px-3 py-2"
              >
                <span className="shrink-0 rounded bg-base-2 px-1.5 py-0.5 font-mono text-[9px] text-text-muted">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="font-medium text-text-muted">when</span>
                    {Object.entries(rule.when).map(([k, v]) => (
                      <span key={k} className="font-mono text-text-secondary">
                        {k}=<span className="text-accent">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="font-medium text-text-muted">then</span>
                    {Object.entries(rule.then).map(([k, v]) => (
                      <span
                        key={k}
                        className={`font-mono ${
                          k === "escalate"
                            ? "text-amber-400"
                            : "text-text-secondary"
                        }`}
                      >
                        {k}=<span className="text-emerald-400">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

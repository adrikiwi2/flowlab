"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Pencil,
  Layers,
  MessageSquare,
  FileCode,
  ChevronDown,
  ChevronUp,
  Settings2,
} from "lucide-react";
import { FlowDesigner } from "@/components/flow-designer";
import { SimulationPanel } from "@/components/simulation-panel";
import { TemplateEditor } from "@/components/template-editor";
import type { FlowWithDetails } from "@/lib/types";

type Tab = "designer" | "simulate" | "templates";

export default function FlowPage() {
  const { flowId } = useParams<{ flowId: string }>();
  const [flow, setFlow] = useState<FlowWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("designer");
  const [showConfig, setShowConfig] = useState(false);

  // Editable header fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleA, setRoleA] = useState("");
  const [roleB, setRoleB] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  const fetchFlow = useCallback(async () => {
    const res = await fetch(`/api/flows/${flowId}`);
    if (!res.ok) return;
    const data: FlowWithDetails = await res.json();
    setFlow(data);
    setName(data.name);
    setDescription(data.description);
    setRoleA(data.role_a_label);
    setRoleB(data.role_b_label);
    setSystemPrompt(data.system_prompt);
    setLoading(false);
  }, [flowId]);

  useEffect(() => {
    fetchFlow();
  }, [fetchFlow]);

  const saveField = async (field: string, value: string) => {
    await fetch(`/api/flows/${flowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "designer", label: "Designer", icon: Layers },
    { key: "simulate", label: "Simulate", icon: MessageSquare },
    { key: "templates", label: "Templates", icon: FileCode },
  ];

  if (loading || !flow) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 pt-5 pb-0">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            {/* Flow name */}
            <div className="group flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => name !== flow.name && saveField("name", name)}
                className="bg-transparent text-xl font-bold tracking-tight text-text-primary outline-none"
                placeholder="Flow name"
              />
              <Pencil
                size={13}
                className="text-transparent transition-all group-hover:text-text-muted"
              />
            </div>

            {/* Description */}
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() =>
                description !== flow.description &&
                saveField("description", description)
              }
              className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none"
              placeholder="Add a description..."
            />
          </div>

          {/* Config toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              showConfig
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border-bright text-text-secondary hover:border-accent/30 hover:text-accent"
            }`}
          >
            <Settings2 size={13} />
            Config
            {showConfig ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* Expandable config */}
        {showConfig && (
          <div className="mt-4 animate-fade-in rounded-lg border border-border bg-base-0 p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Role labels */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Role A Label
                </label>
                <input
                  value={roleA}
                  onChange={(e) => setRoleA(e.target.value)}
                  onBlur={() =>
                    roleA !== flow.role_a_label &&
                    saveField("role_a_label", roleA)
                  }
                  className="w-full rounded-md border border-border bg-base-1 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent/40"
                  placeholder="Company"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Role B Label
                </label>
                <input
                  value={roleB}
                  onChange={(e) => setRoleB(e.target.value)}
                  onBlur={() =>
                    roleB !== flow.role_b_label &&
                    saveField("role_b_label", roleB)
                  }
                  className="w-full rounded-md border border-border bg-base-1 px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent/40"
                  placeholder="Prospect"
                />
              </div>
            </div>

            {/* System prompt */}
            <div className="mt-4">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                System Prompt (base instruction for AI)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                onBlur={() =>
                  systemPrompt !== flow.system_prompt &&
                  saveField("system_prompt", systemPrompt)
                }
                rows={3}
                className="w-full resize-none rounded-md border border-border bg-base-1 px-3 py-2 font-mono text-xs leading-relaxed text-text-primary outline-none transition-colors focus:border-accent/40"
                placeholder="You are an intelligent conversation router..."
              />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "designer" && (
          <FlowDesigner
            flowId={flowId}
            categories={flow.categories}
            extractFields={flow.extract_fields}
            onUpdate={fetchFlow}
          />
        )}
        {activeTab === "simulate" && (
          <SimulationPanel
            flowId={flowId}
            roleALabel={roleA || "Company"}
            roleBLabel={roleB || "Prospect"}
            categories={flow.categories}
          />
        )}
        {activeTab === "templates" && (
          <TemplateEditor
            flowId={flowId}
            templates={flow.templates}
            categories={flow.categories}
            onUpdate={fetchFlow}
          />
        )}
      </div>
    </div>
  );
}

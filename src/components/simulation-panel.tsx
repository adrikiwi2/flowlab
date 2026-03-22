"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import {
  Plus,
  Save,
  Zap,
  Trash2,
  MessageCircle,
  Send,
  Loader2,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  BellOff,
  Check,
  X,
  Radio,
  BarChart2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { ChatBubble } from "./chat-bubble";
import { AiResultCard } from "./ai-result-card";
import { RoleSwitcher } from "./role-switcher";
import type {
  Simulation,
  SimMessage,
  InferenceResult,
  Category,
  Template,
} from "@/lib/types";

interface SimulationPanelProps {
  flowId: string;
  roleALabel: string;
  roleBLabel: string;
  categories: Category[];
  templates: Template[];
  fireAlerts: boolean;
  onToggleAlerts: (value: boolean) => void;
}

export function SimulationPanel({
  flowId,
  roleALabel,
  roleBLabel,
  categories,
  templates,
  fireAlerts,
  onToggleAlerts,
}: SimulationPanelProps) {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [activeSimId, setActiveSimId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SimMessage[]>([]);
  const [viewMode, setViewMode] = useState<"a" | "b" | "inference">("b");
  const [inputText, setInputText] = useState("");
  const [isInferring, setIsInferring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [metricsMode, setMetricsMode] = useState<"simulate" | "live">("simulate");

  // inferenceByMsgId: msgId → result (for messages already in chat)
  const [inferenceByMsgId, setInferenceByMsgId] = useState<Record<string, InferenceResult>>({});
  // expandedResults: which result cards are expanded
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  // approvedMsgIds: role-A messages that were explicitly approved
  const [approvedMsgIds, setApprovedMsgIds] = useState<Set<string>>(new Set());

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxH = 120;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [inputText]);

  const scrollToBottom = () =>
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchSims = useCallback(async () => {
    const res = await fetch(`/api/simulations?flow_id=${flowId}`);
    if (res.ok) setSimulations(await res.json());
  }, [flowId]);

  useEffect(() => {
    fetchSims();
  }, [fetchSims]);

  const loadSim = (sim: Simulation) => {
    setActiveSimId(sim.id);
    setMessages(JSON.parse(sim.messages_json || "[]"));
    if (sim.last_result_json) {
      try {
        const parsed = JSON.parse(sim.last_result_json);
        setInferenceByMsgId(parsed.detected_status ? {} : parsed);
      } catch {
        setInferenceByMsgId({});
      }
    } else {
      setInferenceByMsgId({});
    }
    setExpandedResults(new Set());
    setApprovedMsgIds(new Set());
    setHasUnsaved(false);
  };

  const newSim = () => {
    setActiveSimId(null);
    setMessages([]);
    setInferenceByMsgId({});
    setExpandedResults(new Set());
    setApprovedMsgIds(new Set());
    setHasUnsaved(false);
    setInputText("");
  };

  const sendMessage = () => {
    if (!inputText.trim() || viewMode === "inference") return;
    const msg: SimMessage = {
      id: nanoid(),
      role: viewMode,
      body: inputText.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInputText("");
    setHasUnsaved(true);
    setExpandedResults(new Set());
    setTimeout(scrollToBottom, 50);
  };

  const handleModeChange = (mode: "a" | "b" | "inference") => {
    if (mode !== "inference") setExpandedResults(new Set());
    setViewMode(mode);
  };

  const toggleResult = (msgId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  const approveMsg = (msgId: string) => {
    setApprovedMsgIds((prev) => new Set(prev).add(msgId));
    setHasUnsaved(true);
  };

  const rejectMsg = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setInferenceByMsgId((prev) => {
      const next = { ...prev };
      delete next[msgId];
      return next;
    });
    setHasUnsaved(true);
  };

  const runInference = async () => {
    if (messages.length === 0 || categories.length === 0) return;
    setIsInferring(true);
    setViewMode("inference");
    try {
      const res = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow_id: flowId, messages, fire_alerts: fireAlerts }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Inference failed");
      }
      const result: InferenceResult = await res.json();

      if (result.generated_response) {
        const msgId = nanoid();
        const msg: SimMessage = { id: msgId, role: "a", body: result.generated_response, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, msg]);
        setInferenceByMsgId((prev) => ({ ...prev, [msgId]: result }));
        setExpandedResults((prev) => new Set(prev).add(msgId));
      } else if (result.suggested_template_id) {
        const tpl = templates.find((t) => t.id === result.suggested_template_id);
        if (tpl) {
          const msgId = nanoid();
          const msg: SimMessage = { id: msgId, role: "a", body: tpl.body, timestamp: new Date().toISOString() };
          setMessages((prev) => [...prev, msg]);
          setInferenceByMsgId((prev) => ({ ...prev, [msgId]: result }));
          setExpandedResults((prev) => new Set(prev).add(msgId));
        }
      } else {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg) {
          setInferenceByMsgId((prev) => ({ ...prev, [lastMsg.id]: result }));
          setExpandedResults((prev) => new Set(prev).add(lastMsg.id));
        }
      }
      setHasUnsaved(true);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Inference failed");
    } finally {
      setIsInferring(false);
    }
  };

  const latestResult = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (inferenceByMsgId[messages[i].id]) return inferenceByMsgId[messages[i].id];
    }
    return null;
  })();

  const saveSim = async () => {
    setIsSaving(true);
    try {
      const payload = {
        flow_id: flowId,
        title: messages.length > 0 ? messages[0].body.slice(0, 50) : "Empty simulation",
        messages_json: JSON.stringify(messages),
        last_result_json: Object.keys(inferenceByMsgId).length > 0 ? JSON.stringify(inferenceByMsgId) : null,
        detected_status: latestResult?.detected_status || null,
      };
      if (activeSimId) {
        await fetch(`/api/simulations/${activeSimId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        const res = await fetch("/api/simulations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const sim = await res.json();
        setActiveSimId(sim.id);
        await fetch(`/api/simulations/${sim.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      setHasUnsaved(false);
      fetchSims();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSim = async (id: string) => {
    await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    if (activeSimId === id) newSim();
    fetchSims();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runInference(); }
  };

  // Computed metrics
  const pendingMsgIds = messages
    .filter((m) => m.role === "a" && inferenceByMsgId[m.id] && !approvedMsgIds.has(m.id))
    .map((m) => m.id);
  const needsHumanCount = Object.values(inferenceByMsgId).filter((r) => r.needs_human).length;
  const inferenceCount = Object.keys(inferenceByMsgId).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ─── LEFT: Sim list + Chat ─── */}
      <div className="flex min-w-0 flex-1 gap-3 p-4 pr-0">
        {/* Simulation list (collapsible) */}
        <div className={`flex flex-shrink-0 flex-col rounded-xl border border-border bg-base-1 transition-all duration-200 ${sidebarOpen ? "w-52" : "w-10"}`}>
          <div className="flex items-center justify-between border-b border-border px-2 py-2.5">
            {sidebarOpen && (
              <span className="pl-1 text-xs font-semibold text-text-secondary">Simulations</span>
            )}
            <div className={`flex items-center gap-0.5 ${sidebarOpen ? "" : "mx-auto"}`}>
              {sidebarOpen && (
                <button onClick={newSim} className="rounded-md p-1 text-text-muted transition-all hover:bg-base-3 hover:text-accent">
                  <Plus size={14} />
                </button>
              )}
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="rounded-md p-1 text-text-muted transition-all hover:bg-base-3 hover:text-accent"
                title={sidebarOpen ? "Collapse" : "Expand"}
              >
                {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              </button>
            </div>
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto p-1.5">
              {simulations.length === 0 && (
                <p className="px-2 py-4 text-center text-[11px] text-text-muted">No saved simulations</p>
              )}
              {simulations.map((sim) => {
                const isActive = sim.id === activeSimId;
                const statusCategory = categories.find((c) => c.name === sim.detected_status);
                return (
                  <div
                    key={sim.id}
                    onClick={() => loadSim(sim)}
                    className={`group mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-all ${isActive ? "bg-accent/10 text-text-primary" : "text-text-secondary hover:bg-base-2"}`}
                  >
                    <MessageCircle size={12} className="flex-shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{sim.title || "Untitled"}</p>
                      {sim.detected_status && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusCategory?.color || "#6366f1" }} />
                          <span className="font-mono text-[9px] text-text-muted">{sim.detected_status}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSim(sim.id); }}
                      className="rounded p-0.5 text-transparent transition-all group-hover:text-text-muted group-hover:hover:text-danger"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-base-1">
          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <RoleSwitcher activeMode={viewMode} onModeChange={handleModeChange} roleALabel={roleALabel} roleBLabel={roleBLabel} />
            <div className="flex items-center gap-2">
              {hasUnsaved && <span className="mr-1 text-[10px] text-warning">unsaved</span>}
              <button
                onClick={() => onToggleAlerts(!fireAlerts)}
                title={fireAlerts ? "Alerts ON" : "Alerts OFF"}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${fireAlerts ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "border-border-bright text-text-muted hover:border-border hover:text-text-secondary"}`}
              >
                {fireAlerts ? <Bell size={12} /> : <BellOff size={12} />}
                {fireAlerts ? "Alerts ON" : "Alerts OFF"}
              </button>
              <button
                onClick={runInference}
                disabled={isInferring || messages.length === 0 || categories.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent to-violet px-3 py-1.5 text-xs font-semibold text-white transition-all hover:shadow-md hover:shadow-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isInferring ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                Infer
              </button>
              <button
                onClick={saveSim}
                disabled={isSaving || messages.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-border-bright px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={13} />
                Save
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-text-muted">
                <MessageCircle size={28} className="mb-2 opacity-40" />
                <p className="text-xs">
                  Start typing as <span className="font-semibold text-accent">{roleALabel}</span> or{" "}
                  <span className="font-semibold text-text-secondary">{roleBLabel}</span>
                </p>
                <p className="mt-1 text-[10px]">Ctrl+Enter to run inference.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => {
                  const result = inferenceByMsgId[msg.id];
                  const isExpanded = expandedResults.has(msg.id);
                  const isPending = msg.role === "a" && !!result && !approvedMsgIds.has(msg.id);
                  const isApproved = approvedMsgIds.has(msg.id);

                  return (
                    <div key={msg.id}>
                      {result && (
                        isExpanded ? (
                          <div className="mb-2">
                            <AiResultCard result={result} categories={categories} templates={templates} />
                            {/* Approve / Reject — only for proposed role-A messages */}
                            {isPending && (
                              <div className="mx-auto mt-2 flex w-full max-w-[90%] gap-2">
                                <button
                                  onClick={() => approveMsg(msg.id)}
                                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
                                >
                                  <Check size={13} />
                                  Aprobar y enviar
                                </button>
                                <button
                                  onClick={() => rejectMsg(msg.id)}
                                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                                >
                                  <X size={13} />
                                  Rechazar
                                </button>
                              </div>
                            )}
                            <div className="mt-1 flex justify-center">
                              <button onClick={() => toggleResult(msg.id)} className="text-[10px] text-text-muted transition-colors hover:text-accent">
                                collapse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-1 flex justify-center py-1">
                            <button
                              onClick={() => toggleResult(msg.id)}
                              className="group flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-[11px] font-medium text-accent/70 transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                            >
                              <HelpCircle size={13} />
                              <span className="font-mono text-[10px]" style={{ color: categories.find((c) => c.name === result.detected_status)?.color }}>
                                {result.detected_status}
                              </span>
                              {isPending && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" />}
                              {isApproved && <Check size={10} className="ml-1 text-emerald-400" />}
                            </button>
                          </div>
                        )
                      )}
                      <div className={isPending ? "opacity-60" : ""}>
                        <ChatBubble
                          body={msg.body}
                          role={msg.role}
                          roleLabel={msg.role === "a" ? roleALabel : roleBLabel}
                          timestamp={msg.timestamp}
                          index={i}
                        />
                      </div>
                    </div>
                  );
                })}
                {isInferring && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-xs text-accent">
                      <Loader2 size={13} className="animate-spin" />
                      Analyzing conversation...
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border px-4 py-3">
            {viewMode === "inference" ? (
              <div className="flex items-center justify-center rounded-lg bg-base-0 px-4 py-3 text-xs text-text-muted">
                <Zap size={13} className="mr-2 text-accent" />
                Inference mode — switch to a role to send messages
              </div>
            ) : (
              <div className={`flex items-end gap-2 rounded-lg border bg-base-0 px-3 py-2 transition-colors ${viewMode === "a" ? "border-accent/30" : "border-border"}`}>
                <span className={`mb-1 text-[10px] font-bold uppercase tracking-widest ${viewMode === "a" ? "text-accent" : "text-text-muted"}`}>
                  {viewMode === "a" ? roleALabel : roleBLabel}
                </span>
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ overflow: "hidden" }}
                  className="flex-1 resize-none bg-transparent text-sm text-text-primary outline-none"
                  placeholder="Type a message..."
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="mb-0.5 rounded-md p-1.5 text-text-muted transition-all hover:bg-accent/10 hover:text-accent disabled:opacity-30"
                >
                  <Send size={15} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Metrics panel ─── */}
      <div className="flex w-72 flex-shrink-0 flex-col gap-3 overflow-y-auto p-4">
        {/* Mode switcher */}
        <div className="flex rounded-lg border border-border bg-base-1 p-1">
          <button
            onClick={() => setMetricsMode("simulate")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${metricsMode === "simulate" ? "bg-base-2 text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
          >
            <BarChart2 size={12} />
            Simulate
          </button>
          <button
            onClick={() => setMetricsMode("live")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${metricsMode === "live" ? "bg-emerald-500/15 text-emerald-400" : "text-text-muted hover:text-text-secondary"}`}
          >
            <Radio size={12} />
            Live
          </button>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-base-1 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Mensajes</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{messages.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-base-1 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Inferencias</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{inferenceCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-base-1 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Needs Human</p>
            <p className={`mt-1 text-2xl font-bold ${needsHumanCount > 0 ? "text-amber-400" : "text-text-primary"}`}>
              {needsHumanCount}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-base-1 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Pendientes</p>
            <p className={`mt-1 text-2xl font-bold ${pendingMsgIds.length > 0 ? "text-violet-400" : "text-text-primary"}`}>
              {pendingMsgIds.length}
            </p>
          </div>
        </div>

        {/* Last category */}
        {latestResult && (
          <div className="rounded-xl border border-border bg-base-1 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">Última clasificación</p>
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: categories.find((c) => c.name === latestResult.detected_status)?.color || "#6366f1" }}
              />
              <span className="font-mono text-xs text-text-primary">{latestResult.detected_status}</span>
            </div>
            {latestResult.needs_human && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400">
                <AlertTriangle size={11} />
                {latestResult.needs_human_reason || "Needs human review"}
              </div>
            )}
          </div>
        )}

        {/* Outbox — pending approvals */}
        <div className="rounded-xl border border-border bg-base-1">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <span className="text-xs font-semibold text-text-secondary">Outbox</span>
            {pendingMsgIds.length > 0 && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                {pendingMsgIds.length}
              </span>
            )}
          </div>
          {pendingMsgIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-6 text-text-muted">
              <Clock size={18} className="opacity-40" />
              <p className="text-[11px]">Sin mensajes pendientes</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {pendingMsgIds.map((msgId) => {
                const msg = messages.find((m) => m.id === msgId);
                const result = inferenceByMsgId[msgId];
                if (!msg || !result) return null;
                const tpl = result.suggested_template_id
                  ? templates.find((t) => t.id === result.suggested_template_id)
                  : null;
                return (
                  <div key={msgId} className="rounded-lg border border-border bg-base-0 p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: categories.find((c) => c.name === result.detected_status)?.color || "#6366f1" }}
                      />
                      <span className="font-mono text-[10px] text-text-muted">{result.detected_status}</span>
                    </div>
                    <p className="mb-2 line-clamp-3 text-[11px] leading-relaxed text-text-secondary">
                      {tpl?.name ? `[${tpl.name}] ` : ""}{msg.body}
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => approveMsg(msgId)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 py-1 text-[11px] font-medium text-emerald-400 transition-all hover:bg-emerald-500/20"
                      >
                        <Check size={11} />
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectMsg(msgId)}
                        className="flex items-center justify-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-400 transition-all hover:bg-red-500/20"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

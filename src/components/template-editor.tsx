"use client";

import { useState } from "react";
import { Plus, Trash2, FileCode, Tag } from "lucide-react";
import type { Template, Category } from "@/lib/types";

interface TemplateEditorProps {
  flowId: string;
  templates: Template[];
  categories: Category[];
  onUpdate: () => void;
}

export function TemplateEditor({
  flowId,
  templates,
  categories,
  onUpdate,
}: TemplateEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(
    templates[0]?.id || null
  );

  const activeTemplate = templates.find((t) => t.id === activeId);

  const addTemplate = async () => {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow_id: flowId,
        name: "New Template",
        body: "Hello {{name}},\n\nYour message here...",
      }),
    });
    const t = await res.json();
    setActiveId(t.id);
    onUpdate();
  };

  const updateTemplate = async (id: string, data: Partial<Template>) => {
    await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onUpdate();
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (activeId === id) setActiveId(templates[0]?.id || null);
    onUpdate();
  };

  // Highlight {{variables}} in template body
  const renderPreview = (body: string) => {
    const parts = body.split(/(\{\{\w+\}\})/g);
    return parts.map((part, i) =>
      part.match(/^\{\{\w+\}\}$/) ? (
        <span key={i} className="rounded bg-accent/20 px-1 font-mono text-accent">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[400px] gap-4">
      {/* Template List */}
      <div className="flex w-56 flex-shrink-0 flex-col rounded-xl border border-border bg-base-1">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-xs font-semibold text-text-secondary">
            Templates
          </span>
          <button
            onClick={addTemplate}
            className="rounded-md p-1 text-text-muted transition-all hover:bg-base-3 hover:text-accent"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
          {templates.length === 0 && (
            <p className="px-2 py-4 text-center text-[11px] text-text-muted">
              No templates yet
            </p>
          )}
          {templates.map((tmpl) => {
            const isActive = tmpl.id === activeId;
            const linkedCat = categories.find(
              (c) => c.id === tmpl.category_id
            );
            return (
              <div
                key={tmpl.id}
                onClick={() => setActiveId(tmpl.id)}
                className={`group mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-all ${
                  isActive
                    ? "bg-accent/10 text-text-primary"
                    : "text-text-secondary hover:bg-base-2"
                }`}
              >
                <FileCode size={12} className="flex-shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">
                    {tmpl.name}
                  </p>
                  {linkedCat && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: linkedCat.color }}
                      />
                      <span className="font-mono text-[9px] text-text-muted">
                        {linkedCat.name}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(tmpl.id);
                  }}
                  className="rounded p-0.5 text-transparent transition-all group-hover:text-text-muted group-hover:hover:text-danger"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-base-1">
        {activeTemplate ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border px-4 py-3">
              <input
                value={activeTemplate.name}
                onChange={(e) =>
                  updateTemplate(activeTemplate.id, { name: e.target.value })
                }
                className="flex-1 bg-transparent text-sm font-semibold text-text-primary outline-none"
                placeholder="Template name"
              />

              {/* Category selector */}
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-text-muted" />
                <select
                  value={activeTemplate.category_id || ""}
                  onChange={(e) =>
                    updateTemplate(activeTemplate.id, {
                      category_id: e.target.value || null,
                    })
                  }
                  className="rounded-md border border-border bg-base-0 px-2 py-1 text-xs text-text-secondary outline-none"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Body editor */}
            <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
              <div className="flex-1">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Template Body
                </label>
                <textarea
                  value={activeTemplate.body}
                  onChange={(e) =>
                    updateTemplate(activeTemplate.id, { body: e.target.value })
                  }
                  className="h-full min-h-[200px] w-full resize-none rounded-lg border border-border bg-base-0 px-4 py-3 font-mono text-sm leading-relaxed text-text-primary outline-none transition-colors focus:border-accent/40"
                  placeholder="Write your template here. Use {{variable}} for dynamic content."
                />
              </div>

              {/* Preview */}
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  Preview
                </label>
                <div className="rounded-lg border border-border bg-base-0/50 px-4 py-3 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
                  {renderPreview(activeTemplate.body)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-text-muted">
            <FileCode size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Select or create a template</p>
          </div>
        )}
      </div>
    </div>
  );
}

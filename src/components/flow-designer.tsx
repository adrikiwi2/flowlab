"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Palette,
  FileText,
  Database,
} from "lucide-react";
import type { Category, ExtractField } from "@/lib/types";

interface FlowDesignerProps {
  flowId: string;
  categories: Category[];
  extractFields: ExtractField[];
  onUpdate: () => void;
}

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
];

export function FlowDesigner({
  flowId,
  categories,
  extractFields,
  onUpdate,
}: FlowDesignerProps) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const addCategory = async () => {
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow_id: flowId,
        name: "new_category",
        color: PRESET_COLORS[categories.length % PRESET_COLORS.length],
      }),
    });
    onUpdate();
  };

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>) => {
      setSavingId(id);
      await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSavingId(null);
      onUpdate();
    },
    [onUpdate]
  );

  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    onUpdate();
  };

  const addField = async () => {
    await fetch("/api/extract-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flow_id: flowId,
        field_name: "new_field",
        field_type: "text",
      }),
    });
    onUpdate();
  };

  const updateField = async (id: string, data: Partial<ExtractField>) => {
    await fetch(`/api/extract-fields/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    onUpdate();
  };

  const deleteField = async (id: string) => {
    await fetch(`/api/extract-fields/${id}`, { method: "DELETE" });
    onUpdate();
  };

  return (
    <div className="space-y-8">
      {/* Categories */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={15} className="text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">
              Classification Categories
            </h3>
            <span className="rounded-full bg-base-3 px-2 py-0.5 text-[10px] font-mono text-text-muted">
              {categories.length}
            </span>
          </div>
          <button
            onClick={addCategory}
            className="flex items-center gap-1.5 rounded-lg border border-border-bright px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-accent/40 hover:text-accent"
          >
            <Plus size={13} />
            Add Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-bright bg-base-1/50 px-4 py-8 text-center">
            <p className="text-xs text-text-muted">
              No categories defined. Add at least one to enable AI classification.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                isSaving={savingId === cat.id}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />
            ))}
          </div>
        )}
      </section>

      {/* Extract Fields */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-violet" />
            <h3 className="text-sm font-semibold text-text-primary">
              Extract Fields
            </h3>
            <span className="rounded-full bg-base-3 px-2 py-0.5 text-[10px] font-mono text-text-muted">
              {extractFields.length}
            </span>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-1.5 rounded-lg border border-border-bright px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-violet/40 hover:text-violet"
          >
            <Plus size={13} />
            Add Field
          </button>
        </div>

        <p className="mb-3 text-xs text-text-muted">
          Fields the AI should extract from conversations (e.g., email, phone,
          budget).
        </p>

        {extractFields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-bright bg-base-1/50 px-4 py-6 text-center">
            <p className="text-xs text-text-muted">
              No extract fields. The AI will only classify, not extract data.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {extractFields.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                onUpdate={updateField}
                onDelete={deleteField}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Category Row ─────────────────────────────── */

function CategoryRow({
  category,
  isSaving,
  onUpdate,
  onDelete,
}: {
  category: Category;
  isSaving: boolean;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [rules, setRules] = useState(category.rules);
  const [expanded, setExpanded] = useState(false);

  const saveField = (field: string, value: string) => {
    onUpdate(category.id, { [field]: value });
  };

  return (
    <div className="rounded-lg border border-border bg-base-1 transition-all hover:border-border-bright">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Color picker */}
        <div className="relative">
          <div
            className="h-4 w-4 rounded-full cursor-pointer ring-2 ring-offset-1 ring-offset-base-1"
            style={{
              backgroundColor: category.color,
              boxShadow: `0 0 0 2px var(--color-base-1), 0 0 0 4px ${category.color}`,
            }}
          />
          <input
            type="color"
            value={category.color}
            onChange={(e) => onUpdate(category.id, { color: e.target.value })}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== category.name && saveField("name", name)}
          className="flex-1 bg-transparent font-mono text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
          placeholder="category_name"
        />

        {/* Status */}
        {isSaving && (
          <span className="text-[10px] text-accent">saving...</span>
        )}

        {/* Expand / Delete */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-md p-1.5 text-text-muted transition-all hover:bg-base-3 hover:text-text-secondary"
        >
          <FileText size={13} />
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="rounded-md p-1.5 text-text-muted transition-all hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Rules textarea (expandable) */}
      {expanded && (
        <div className="border-t border-border px-4 py-3">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Classification Rules
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            onBlur={() => rules !== category.rules && saveField("rules", rules)}
            rows={3}
            className="w-full resize-none rounded-md border border-border bg-base-0 px-3 py-2 font-mono text-xs leading-relaxed text-text-primary outline-none transition-colors focus:border-accent/40"
            placeholder='Describe when to classify as this status, e.g.: "The prospect explicitly expresses interest, asks for pricing, or requests a demo."'
          />
        </div>
      )}
    </div>
  );
}

/* ── Field Row ────────────────────────────────── */

function FieldRow({
  field,
  onUpdate,
  onDelete,
}: {
  field: ExtractField;
  onUpdate: (id: string, data: Partial<ExtractField>) => void;
  onDelete: (id: string) => void;
}) {
  const [fieldName, setFieldName] = useState(field.field_name);
  const [description, setDescription] = useState(field.description);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-base-1 px-4 py-3">
      <input
        value={fieldName}
        onChange={(e) => setFieldName(e.target.value)}
        onBlur={() =>
          fieldName !== field.field_name &&
          onUpdate(field.id, { field_name: fieldName })
        }
        className="w-32 bg-transparent font-mono text-xs font-medium text-text-primary outline-none"
        placeholder="field_name"
      />

      <select
        value={field.field_type}
        onChange={(e) => onUpdate(field.id, { field_type: e.target.value as ExtractField["field_type"] })}
        className="rounded-md border border-border bg-base-0 px-2 py-1 text-xs text-text-secondary outline-none"
      >
        <option value="text">text</option>
        <option value="email">email</option>
        <option value="number">number</option>
        <option value="date">date</option>
      </select>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() =>
          description !== field.description &&
          onUpdate(field.id, { description })
        }
        className="flex-1 bg-transparent text-xs text-text-secondary outline-none"
        placeholder="Description for the AI..."
      />

      <button
        onClick={() => onDelete(field.id)}
        className="rounded-md p-1.5 text-text-muted transition-all hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

"use client";

interface ChatBubbleProps {
  body: string;
  role: "a" | "b";
  roleLabel: string;
  timestamp?: string;
  index: number;
}

export function ChatBubble({
  body,
  role,
  roleLabel,
  timestamp,
  index,
}: ChatBubbleProps) {
  const isRoleA = role === "a";

  return (
    <div
      className={`flex ${isRoleA ? "justify-end" : "justify-start"} animate-slide-up`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className={`max-w-[75%] ${isRoleA ? "items-end" : "items-start"}`}>
        <div
          className={`mb-0.5 flex items-center gap-2 px-1 text-xs font-medium tracking-wide ${
            isRoleA ? "justify-end" : ""
          }`}
        >
          <span
            className="uppercase"
            style={{
              color: isRoleA
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            }}
          >
            {roleLabel}
          </span>
          {timestamp && (
            <span className="text-text-muted font-mono text-[10px]">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            isRoleA
              ? "rounded-br-sm bg-accent/15 text-text-primary border border-accent/20"
              : "rounded-bl-sm bg-base-3 text-text-primary border border-border"
          }`}
        >
          {body.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < body.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

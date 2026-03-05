"use client";

import { MessageSquare, User, Zap } from "lucide-react";

interface RoleSwitcherProps {
  activeMode: "a" | "b" | "inference";
  onModeChange: (mode: "a" | "b" | "inference") => void;
  roleALabel: string;
  roleBLabel: string;
}

export function RoleSwitcher({
  activeMode,
  onModeChange,
  roleALabel,
  roleBLabel,
}: RoleSwitcherProps) {
  const modes = [
    { key: "a" as const, label: roleALabel, icon: MessageSquare },
    { key: "b" as const, label: roleBLabel, icon: User },
    { key: "inference" as const, label: "Inference", icon: Zap },
  ];

  return (
    <div className="flex rounded-lg bg-base-1 p-1 gap-0.5">
      {modes.map((mode) => {
        const isActive = activeMode === mode.key;
        const Icon = mode.icon;
        return (
          <button
            key={mode.key}
            onClick={() => onModeChange(mode.key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? mode.key === "inference"
                  ? "bg-gradient-to-r from-accent to-violet text-white shadow-sm shadow-accent/20"
                  : "bg-base-3 text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary hover:bg-base-2"
            }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

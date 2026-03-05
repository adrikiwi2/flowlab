"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-0">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
            <Activity size={24} className="text-accent" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            FlowLab
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            Sign in to your workspace
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-base-1 p-6"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-base-0 px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent/40"
              placeholder="you@company.com"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-base-0 px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent/40"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dim disabled:opacity-50"
          >
            <LogIn size={15} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

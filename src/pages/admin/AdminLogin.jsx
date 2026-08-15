import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[hsl(var(--alabaster))] px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-border/60">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--navy))] text-white mb-5" style={{ background: "hsl(var(--navy))" }}>
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--navy))" }}>Admin sign in</h1>
        <p className="mt-1 text-sm text-foreground/55">T2 Laundry command center</p>

        <div className="mt-6 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="mt-6 w-full rounded-xl bg-[hsl(var(--navy))] py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "hsl(var(--navy))" }}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

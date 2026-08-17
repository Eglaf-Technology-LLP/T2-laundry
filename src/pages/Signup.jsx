import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { UserPlus, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await signup(email, password, fullName);
      if (loggedIn) {
        const next = searchParams.get("next") || "/subscription";
        navigate(next, { replace: true });
      } else {
        setNeedsEmailConfirm(true);
      }
    } catch (err) {
      setError(err.message || "Couldn't create your account. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (needsEmailConfirm) {
    return (
      <div className="min-h-[70vh] grid place-items-center px-4 py-16 text-center">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-border/60">
          <div className="grid h-11 w-11 mx-auto place-items-center rounded-full bg-[hsl(var(--navy))] text-white mb-5" style={{ background: "hsl(var(--navy))" }}>
            <MailCheck className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--navy))" }}>Check your email</h1>
          <p className="mt-2 text-sm text-foreground/55">
            We've sent a confirmation link to <span className="font-medium">{email}</span>. Click it, then come back and log in.
          </p>
          <Link to={{ pathname: "/login", search: searchParams.toString() }} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--navy))] px-5 py-3 text-sm font-semibold text-white" style={{ background: "hsl(var(--navy))" }}>
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-border/60">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-[hsl(var(--navy))] text-white mb-5" style={{ background: "hsl(var(--navy))" }}>
          <UserPlus className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "hsl(var(--navy))" }}>Create your account</h1>
        <p className="mt-1 text-sm text-foreground/55">Sign up to subscribe to a membership.</p>

        <div className="mt-6 space-y-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
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
            autoComplete="new-password"
            minLength={6}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !fullName || !email || !password}
          className="mt-6 w-full rounded-xl bg-[hsl(var(--navy))] py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "hsl(var(--navy))" }}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-5 text-center text-sm text-foreground/55">
          Already have an account?{" "}
          <Link to={{ pathname: "/login", search: searchParams.toString() }} className="font-semibold" style={{ color: "hsl(var(--navy))" }}>
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

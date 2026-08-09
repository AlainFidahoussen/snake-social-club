import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getServices } from "@/services";

interface AuthFormProps {
  kind: "login" | "signup";
}

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to keep your streak alive.",
    action: "Log in",
    altText: "Need an account?",
    altLabel: "Sign up",
    altTo: "/signup",
  },
  signup: {
    title: "Create your player",
    subtitle: "Pick a handle. It shows up on the leaderboard.",
    action: "Sign up",
    altText: "Already playing?",
    altLabel: "Log in",
    altTo: "/login",
  },
} as const;

export function AuthForm({ kind }: AuthFormProps) {
  const copy = COPY[kind];
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const auth = getServices().auth;
      if (kind === "signup") await auth.signUp({ username, password });
      else await auth.signIn({ username, password });
      await navigate({ to: "/" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.subtitle}</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={kind === "signup" ? "new-password" : "current-password"}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Working…" : copy.action}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {copy.altText}{" "}
        <Link to={copy.altTo} className="text-primary underline-offset-4 hover:underline">
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}

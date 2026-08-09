import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Serpent.io Snake" },
      { name: "description", content: "Create a Serpent.io account to save Snake scores and be spectated live." },
      { property: "og:title", content: "Sign Up — Serpent.io Snake" },
      { property: "og:description", content: "Join the Snake leaderboard in walls or pass-through mode." },
    ],
  }),
  component: () => <AuthForm kind="signup" />,
});

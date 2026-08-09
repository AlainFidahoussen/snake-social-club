import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth-form";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Serpent.io Snake" },
      { name: "description", content: "Log in to save your Snake scores and let others spectate your runs." },
      { property: "og:title", content: "Log In — Serpent.io Snake" },
      { property: "og:description", content: "Access your Snake profile and leaderboard scores." },
    ],
  }),
  component: () => <AuthForm kind="login" />,
});

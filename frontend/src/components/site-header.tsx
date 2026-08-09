import { Link } from "@tanstack/react-router";
import { useSession } from "@/hooks/use-session";

const links = [
  { to: "/", label: "Play" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/watch", label: "Watch" },
] as const;

export function SiteHeader() {
  const { session, signOut } = useSession();

  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-4">
        <Link to="/" className="font-display text-lg tracking-[0.2em] text-primary uppercase">
          Serpent<span className="text-accent">.io</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
              activeOptions={{ exact: link.to === "/" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-sm">
          {session ? (
            <>
              <span className="text-muted-foreground">
                signed in as <span className="text-foreground">{session.user.username}</span>
              </span>
              <button
                onClick={() => void signOut()}
                className="rounded-md border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

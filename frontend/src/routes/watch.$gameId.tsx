import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SnakeBoard } from "@/components/snake-board";
import { getServices } from "@/services";

export const Route = createFileRoute("/watch/$gameId")({
  head: () => ({
    meta: [
      { title: "Spectating a Live Snake Run | Serpent.io" },
      { name: "description", content: "Follow a single player's Snake board live, updating every tick." },
      { property: "og:title", content: "Spectating a Live Snake Run" },
      { property: "og:description", content: "Watch a player's snake grow in real time." },
    ],
  }),
  component: SpectatePage,
});

function SpectatePage() {
  const { gameId } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getServices().games.getGame(gameId),
    refetchInterval: 400,
  });

  if (isPending) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Connecting…</p>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-2xl">That game isn't available</h1>
        <Link to="/watch" className="mt-4 inline-block text-primary underline-offset-4 hover:underline">
          Back to live games
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-baseline justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight">{data.username}</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {data.mode} · {data.status}
          </p>
        </div>
        <span className="font-display text-3xl text-accent">{data.score}</span>
      </div>
      <SnakeBoard
        gridSize={data.gridSize}
        snake={data.snake}
        food={data.food}
        mode={data.mode}
        dimmed={data.status === "over"}
      />
      <Link to="/watch" className="text-sm text-primary underline-offset-4 hover:underline">
        Back to live games
      </Link>
    </div>
  );
}

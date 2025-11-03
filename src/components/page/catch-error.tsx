import type { ErrorComponentProps } from "@tanstack/react-router";
import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import { Home, MoveLeft, RefreshCcw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export function CatchBoundaryPage({ error }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  });

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <Button variant={"outline"} onClick={() => router.invalidate()}>
          <RefreshCcw />
          Try Again
        </Button>
        {isRoot ? (
          <Link to="/" className={buttonVariants({ variant: "secondary" })}>
            <Home />
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className={buttonVariants({ variant: "secondary" })}
            onClick={(e) => {
              e.preventDefault();
              window.history.back();
            }}
          >
            <MoveLeft />
            Go Back
          </Link>
        )}
      </div>
    </div>
  );
}

import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { userId } = useAuth();

  return (
    <section className="relative w-screen h-screen bg-grid-16 grid place-items-center">
      {/* Card */}
      <div className="flex flex-col max-w-lg p-4 mx-auto items-center justify-center gap-4 font-serif border border-blue-200 text-card-foreground rounded-lg bg-blue-500/10">
        <h1 className="text-4xl font-bold text-center">NotesPal</h1>
        <p className="text-center font-semibold">
          Welcome to NotesPal! Start creating your notes now.
        </p>
        {userId ? (
          <Link to="/notes">
            <Button className="bg-blue-600 hover:bg-blue-400">
              Manage Notes
              <ArrowRight />
            </Button>
          </Link>
        ) : (
          <SignUpButton oauthFlow="popup" forceRedirectUrl={"/notes"}>
            <Button className="bg-blue-600 hover:bg-blue-400">
              Sign In
              <ArrowRight />
            </Button>
          </SignUpButton>
        )}
      </div>
    </section>
  );
}

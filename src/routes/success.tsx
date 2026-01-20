import { useUser } from "@clerk/clerk-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Props = {
  checkout_id: string | undefined;
};

export const Route = createFileRoute("/success")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): Props => {
    return {
      checkout_id: search.checkout_id?.toString(),
    };
  },
});

function RouteComponent() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { checkout_id } = Route.useSearch();

  useEffect(() => {
    if ((isLoaded && !user) || checkout_id === undefined) {
      navigate({ to: "/" });
    }
  }, [user, navigate, checkout_id, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="bg-background grid place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="rounded-full bg-green-50 inline-flex p-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>

          <CardContent className="p-0">
            <h1 className="text-2xl md:text-3xl font-semibold">
              Thanks for subscribing!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              You're officially on the list. We'll send occasional updates,
              product news, and the occasional clever one-liner (no promises).
              If you provided an email, we've sent a confirmation below.
            </p>

            {user?.primaryEmailAddress && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border px-4 py-2">
                <Mail className="h-4 w-4 opacity-80" />
                <span className="text-sm">
                  {user.primaryEmailAddress.emailAddress}
                </span>
                <Badge className="ml-2 bg-green-500 text-white">
                  Confirmed
                </Badge>
              </div>
            )}
            {/* Display checkout_id */}
            {checkout_id && (
              <div className="mt-4 items-center space-x-2 px-4 py-2">
                <span className="text-sm">Checkout ID:</span>
                <span className="text-muted-foreground/80 text-sm font-mono">
                  {checkout_id}
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-3">
              <Link
                to="/notes"
                className={cn(buttonVariants(), "inline-flex gap-2")}
              >
                Continue
                <ArrowRight />
              </Link>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              <span>
                You can unsubscribe anytime. We respect your inbox. We also
                respect memes, which is why there will only be tasteful ones.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { useUser } from "@clerk/clerk-react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/success")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  if (!isLoaded) {
    return (
      <div className="bg-background grid place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    navigate({ to: "/", from: "/success" });
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
                <Badge className="ml-2">Confirmed</Badge>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-3">
              <Link to="/notes">
                <Button className="inline-flex gap-2">
                  Continue
                  <ArrowRight />
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              <span>
                You can unsubscribe anytime. We respect your inbox. We also
                respect memes, which is why there will only be tasteful ones.
              </span>
            </div>
          </CardContent>

          {/* Decorative confetti-ish dots — purely CSS/Tailwind for tiny motion */}
          <div className="pointer-events-none absolute -translate-y-28 md:-translate-y-36">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-64 h-32 opacity-40"
              viewBox="0 0 200 80"
              fill="none"
            >
              <title className="sr-only">Confetti</title>
              <circle
                cx="18"
                cy="20"
                r="2.5"
                className="text-chart-1"
                fill="currentColor"
              />
              <circle
                cx="40"
                cy="10"
                r="2"
                className="text-chart-2"
                fill="currentColor"
              />
              <circle
                cx="86"
                cy="22"
                r="2.25"
                className="text-chart-3"
                fill="currentColor"
              />
              <circle
                cx="150"
                cy="8"
                r="1.75"
                className="text-chart-4"
                fill="currentColor"
              />
              <circle
                cx="180"
                cy="26"
                r="2"
                className="text-chart-5"
                fill="currentColor"
              />
            </svg>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

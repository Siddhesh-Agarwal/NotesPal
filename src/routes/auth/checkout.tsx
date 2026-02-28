import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import { ArrowRight, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getCheckoutSessionFn, getUserFn } from "@/functions";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { store } from "@/store";

export const Route = createFileRoute("/auth/checkout")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const user = session?.user;
  const navigate = useNavigate();
  const storeState = useStore(store);

  // Fetch user data to get customerId
  const { isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: () =>
      getUserFn().then((val) => {
        if (!val) {
          throw new Error("Failed to get user");
        }
        store.setState(val);
        return val;
      }),
    enabled: !!user?.id,
  });

  // Fetch checkout session
  const {
    data: checkoutData,
    isLoading: isLoadingCheckout,
    error: checkoutError,
  } = useQuery({
    queryKey: ["checkout", user?.id],
    queryFn: () =>
      getCheckoutSessionFn({
        data: { customerId: storeState?.customerId ?? "" },
      }),
    enabled: !!storeState?.customerId,
  });

  useEffect(() => {
    if (isSessionPending) return;

    // Redirect to sign-in if not authenticated
    if (!session) {
      navigate({ to: "/auth/sign-in" });
      return;
    }

    // If user already has an active subscription, redirect to notes
    if (storeState?.subscribedTill && storeState.subscribedTill > new Date()) {
      navigate({ to: "/notes" });
    }
  }, [session, isSessionPending, navigate, storeState?.subscribedTill]);

  // Redirect to checkout URL when available
  useEffect(() => {
    if (checkoutData?.checkout_url) {
      window.location.href = checkoutData.checkout_url;
    }
  }, [checkoutData?.checkout_url]);

  if (isSessionPending || isLoadingUser) {
    return (
      <div className="bg-background grid place-items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
          <Spinner />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect via useEffect
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
          <div className="rounded-full bg-blue-50 inline-flex p-4">
            {isLoadingCheckout ? (
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            ) : checkoutError ? (
              <CreditCard className="h-10 w-10 text-red-600" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-blue-600" />
            )}
          </div>

          <CardContent className="p-0">
            <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
              {isLoadingCheckout
                ? "Preparing your checkout..."
                : checkoutError
                  ? "Something went wrong"
                  : "Redirecting to checkout..."}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
              {isLoadingCheckout ? (
                "We're setting up your subscription checkout. This will only take a moment."
              ) : checkoutError ? (
                <>
                  We couldn't create your checkout session. Please try again or
                  contact support if the problem persists.
                  <br />
                  <span className="text-xs font-mono mt-2 block">
                    {checkoutError instanceof Error
                      ? checkoutError.message
                      : "Unknown error"}
                  </span>
                </>
              ) : (
                "You'll be redirected to complete your subscription purchase. The 30-day trial period is handled automatically by our payment provider."
              )}
            </p>

            {user?.email && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border px-4 py-2 border-border">
                <span className="text-sm">{user.email}</span>
                <Badge className="ml-2 bg-green-500 text-white border-none">
                  Verified
                </Badge>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:justify-center gap-3">
              {checkoutError ? (
                <>
                  <Button
                    onClick={() => window.location.reload()}
                    className={cn("inline-flex gap-2")}
                  >
                    Try Again
                    <ArrowRight />
                  </Button>
                  <Link
                    to="/notes"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "inline-flex gap-2",
                    )}
                  >
                    Continue to Notes
                  </Link>
                </>
              ) : (
                <Link
                  to="/notes"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "inline-flex gap-2",
                  )}
                >
                  Skip for now
                  <ArrowRight />
                </Link>
              )}
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
              <span>
                Your subscription includes a 30-day trial period. You can cancel
                anytime from your account settings.
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

import { Checkout } from "@polar-sh/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { metadata } from "@/data/meta";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: Checkout({
        accessToken: process.env.POLAR_ACCESS_TOKEN,
        successUrl: process.env.SUCCESS_URL,
        returnUrl: `${metadata.site}/notes`, // An optional URL which renders a back-button in the Checkout
        server: "sandbox", // Use sandbox if you're testing Polar - omit the parameter or pass 'production' otherwise
      }),
    },
  },
});

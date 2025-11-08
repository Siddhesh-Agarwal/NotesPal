import { Checkout } from "@polar-sh/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "node:process";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: Checkout({
        accessToken: env.POLAR_ACCESS_TOKEN,
        successUrl: "/success",
        returnUrl: "/notes",
        server: "sandbox",
      }),
    },
  },
});

// src/routes/api/checkout.ts

import { Checkout } from "@dodopayments/tanstack";
import { createFileRoute } from "@tanstack/react-router";
import { dodoPaymentsEnv } from "@/integrations/dodopayments";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Checkout({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY,
          returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
          environment: dodoPaymentsEnv,
          type: "static",
        })(request);
      },
      POST: async ({ request }) => {
        return Checkout({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY,
          returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
          environment: dodoPaymentsEnv,
          type: "session",
        })(request);
      },
    },
  },
});

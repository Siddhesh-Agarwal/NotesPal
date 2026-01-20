// src/routes/api/customer-portal.ts

import { CustomerPortal } from "@dodopayments/tanstack";
import { createFileRoute } from "@tanstack/react-router";
import { dodoPaymentsEnv } from "@/integrations/dodopayments";

export const Route = createFileRoute("/api/customer-portal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return CustomerPortal({
          bearerToken: process.env.DODO_PAYMENTS_API_KEY,
          environment: dodoPaymentsEnv,
        })(request);
      },
    },
  },
});

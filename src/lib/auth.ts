import { checkout, dodopayments, portal } from "@dodopayments/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { DodoPaymentsClient } from "@/integrations/dodopayments";

export const auth = betterAuth({
  appName: "NotesPal",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    tanstackStartCookies(),
    dodopayments({
      client: DodoPaymentsClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              slug: "notespal-subscription",
              productId: "pdt_0NWd9SA5jGlOQIhWLPf83",
            },
          ],
        }),
        portal(),
      ],
    }),
  ],
});

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { Webhooks } from "@polar-sh/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET;
if (!POLAR_WEBHOOK_SECRET) {
  throw new Error("POLAR_WEBHOOK_SECRET is not defined");
}

export const Route = createFileRoute("/api/webhooks/polar")({
  server: {
    handlers: {
      POST: Webhooks({
        webhookSecret: POLAR_WEBHOOK_SECRET,
        onSubscriptionUpdated: async (payload) => {
          await db
            .update(userTable)
            .set({
              subscribedTill: payload.data.endsAt,
            })
            .where(eq(userTable.customerId, payload.data.customerId));
        },
      }),
    },
  },
});

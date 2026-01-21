import { Webhooks } from "@dodopayments/tanstack";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userTable } from "@/db/schema";

export const Route = createFileRoute("/api/webhooks/dodopayments")({
  server: {
    handlers: {
      GET: ({ request }) => {
        return Webhooks({
          webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
          onPaymentSucceeded: async (payload) => {
            const { customer_id } = payload.data.customer;
            // Have a subscribtion period of 10 years
            const subscribedTill = payload.timestamp;
            subscribedTill.setFullYear(subscribedTill.getFullYear() + 10);
            console.log(
              customer_id,
              "is subscribed till",
              subscribedTill.toISOString(),
            );
            await db
              .update(userTable)
              .set({
                subscribedTill,
              })
              .where(eq(userTable.customerId, customer_id));
          },
        })(request);
      },
    },
  },
});

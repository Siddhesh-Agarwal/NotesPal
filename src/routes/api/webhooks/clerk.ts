import { verifyWebhook } from "@clerk/tanstack-react-start/webhooks";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notesTable, userTable } from "@/db/schema";
import { DodoPaymentsClient } from "@/integrations/dodopayments";
import { generateSalt } from "@/lib/encrypt";

export const Route = createFileRoute("/api/webhooks/clerk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const evt = await verifyWebhook(request);
          const { id } = evt.data;
          const eventType = evt.type;

          if (id === undefined) {
            return Response.json("Invalid user ID", { status: 400 });
          }

          if (eventType === "user.deleted") {
            await db.delete(notesTable).where(eq(notesTable.userId, id));
            await db.delete(userTable).where(eq(userTable.id, id));
          } else if (eventType === "user.created") {
            const customer = await DodoPaymentsClient.customers.create({
              email: evt.data.email_addresses[0].email_address,
              name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`,
              phone_number: evt.data.phone_numbers[0].phone_number,
            });
            await db.insert(userTable).values({
              id: evt.data.id,
              email: evt.data.email_addresses[0].email_address,
              firstName: evt.data.first_name ?? "",
              lastName: evt.data.last_name ?? "",
              customerId: customer.customer_id,
              salt: generateSalt().toString("hex"),
            });
          } else if (eventType === "user.updated") {
            const [user] = await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, evt.data.id));
            await DodoPaymentsClient.customers.update(user.customerId, {
              name: `${evt.data.first_name ?? ""} ${evt.data.last_name ?? ""}`,
              phone_number: evt.data.phone_numbers[0].phone_number,
            });
            await db
              .update(userTable)
              .set({
                email: evt.data.email_addresses[0].email_address,
                firstName: evt.data.first_name ?? "",
                lastName: evt.data.last_name ?? "",
              })
              .where(eq(userTable.id, user.id));
          }
          return Response.json("Webhook received", { status: 200 });
        } catch {
          return Response.json("Error verifying webhook", { status: 400 });
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { Webhook } from "svix";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { polar } from "@/integrations/polar";
import { generateSalt } from "@/lib/encrypt";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
if (!CLERK_WEBHOOK_SECRET) {
  throw new Error("Missing webhook secret");
}

export const Route = createFileRoute("/api/webhooks/clerk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const svix = new Webhook(CLERK_WEBHOOK_SECRET);
        const payload = await request.text();
        const headers = {
          "svix-id": request.headers.get("svix-id") || "",
          "svix-timestamp": request.headers.get("svix-timestamp") || "",
          "svix-signature": request.headers.get("svix-signature") || "",
        };

        const evt = svix.verify(payload, headers);

        if (evt.type === "user.created") {
          const { id, email, name } = evt.data;
          const { id: customerId } = await polar.customers.create({
            externalId: id,
            email,
            name,
          });

          await db.insert(userTable).values({
            id,
            email,
            name,
            customerId,
            salt: generateSalt(),
          });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});

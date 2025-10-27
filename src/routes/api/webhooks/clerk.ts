import { createFileRoute } from "@tanstack/react-router";
import { Webhook } from "svix";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { generateSalt } from "@/lib/encrypt";

export const Route = createFileRoute("/api/webhooks/clerk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
          throw new Error("Missing webhook secret");
        }

        const svix = new Webhook(WEBHOOK_SECRET);
        const payload = await request.text();
        const headers = {
          "svix-id": request.headers.get("svix-id"),
          "svix-timestamp": request.headers.get("svix-timestamp"),
          "svix-signature": request.headers.get("svix-signature"),
        };

        let evt;
        try {
          evt = svix.verify(payload, headers);
        } catch (err) {
          return new Response("Invalid signature", { status: 400 });
        }

        if (evt.type === "user.created") {
          const { id } = evt.data;

          await db.insert(userTable).values({
            id,
            salt: generateSalt(),
          });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});

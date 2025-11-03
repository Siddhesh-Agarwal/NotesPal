import { env } from "node:process";
import { CustomerPortal } from "@polar-sh/tanstack-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/portal")({
  server: {
    middleware: [],
    handlers: {
      GET: CustomerPortal({
        accessToken: env.POLAR_ACCESS_TOKEN,
        server: "sandbox",
        returnUrl: "/notes",
        getCustomerId: async (request) => {
          const body = await request.json();
          const { customerId } = body;
          if (!customerId) {
            throw new Error("No customer ID");
          }
          if (typeof customerId !== "string") {
            throw new Error("Invalid customer ID");
          }
          return customerId;
        },
      }),
    },
  },
});

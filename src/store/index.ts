import { Store } from "@tanstack/react-store";
import type { userTable } from "@/db/schema";

export const store = new Store<
  | Pick<
      typeof userTable.$inferSelect,
      | "firstName"
      | "lastName"
      | "email"
      | "id"
      | "customerId"
      | "subscribedTill"
    >
  | undefined
>(undefined);

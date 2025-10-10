import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const notesTable = pgTable("notes", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar({ length: 36 }).notNull(),
  content: text("content").notNull(),
  tapeColor: varchar({ length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdateFn(() => new Date())
    .notNull(),
});

import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const userTable = pgTable("users", {
  id: varchar("id", { length: 50 }).primaryKey(),
  salt: varchar("salt", { length: 24 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notesTable = pgTable("notes", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar({ length: 50 }).notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  encryptionKey: varchar("encryption_key", { length: 64 }).notNull(),
  iv: varchar("iv", { length: 24 }).notNull(),
  tapeColor: varchar({ length: 7 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdateFn(() => new Date())
    .notNull(),
});

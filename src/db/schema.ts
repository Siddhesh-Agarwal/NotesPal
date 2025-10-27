import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("users", {
  id: text("id", { length: 50 }).primaryKey(),
  customerId: text("customer_id", { length: 50 }).notNull(),
  email: text("email", { length: 256 }).notNull(),
  name: text("name", { length: 256 }).notNull(),
  salt: text("salt", { length: 24 }).notNull(),
  subscribedTill: integer("subscribed_till", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export const notesTable = sqliteTable("notes", {
  id: text("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id", { length: 50 }).notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  encryptionKey: text("encryption_key", { length: 64 }).notNull(),
  iv: text("iv", { length: 24 }).notNull(),
  tapeColor: text("tape_color", { length: 7 }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$onUpdateFn(() => new Date())
    .notNull(),
});

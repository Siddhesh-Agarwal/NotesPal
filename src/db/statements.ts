import { and, eq, sql } from "drizzle-orm";
import { db } from ".";
import { notes as notesTable, user as userTable } from "./schema";

export const getUserNotesStatement = db
  .select()
  .from(notesTable)
  .innerJoin(userTable, eq(notesTable.userId, userTable.id))
  .where(eq(userTable.id, sql.placeholder("userId")))
  .prepare();

export const getUserNoteStatement = db
  .select({
    note: notesTable,
    user: userTable,
  })
  .from(notesTable)
  .innerJoin(userTable, eq(notesTable.userId, userTable.id))
  .where(
    and(
      eq(notesTable.id, sql.placeholder("noteId")),
      eq(notesTable.userId, sql.placeholder("userId")),
    ),
  )
  .prepare();

export const getUserStatement = db
  .select({
    id: userTable.id,
    firstName: userTable.firstName,
    lastName: userTable.lastName,
    email: userTable.email,
    customerId: userTable.customerId,
    subscribedTill: userTable.subscribedTill,
    createdAt: userTable.createdAt,
  })
  .from(userTable)
  .where(eq(userTable.id, sql.placeholder("userId")));

export const deleteNoteStatement = db
  .delete(notesTable)
  .where(
    and(
      eq(notesTable.id, sql.placeholder("noteId")),
      eq(notesTable.userId, sql.placeholder("userId")),
    ),
  )
  .returning()
  .prepare();

import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { TAPE_COLORS } from "@/components/note";
import { db } from "@/db";
import { notesTable, userTable } from "@/db/schema";
import {
  deleteNoteStatement,
  getUserNoteStatement,
  getUserNotesStatement,
  getUserStatement,
} from "@/db/statements";
import { DodoPaymentsClient } from "@/integrations/dodopayments";
import { generateSalt } from "@/lib/encrypt";
import {
  noteSchema,
  signupFormSchema,
  userAndNoteSchema,
  userIdSchema,
} from "@/schema";

export const getNotesFn = createServerFn({ method: "GET" })
  .inputValidator(userIdSchema)
  .handler(async (req) => {
    const { userId } = req.data;
    const notes = await getUserNotesStatement.all({ userId });
    return notes.map((note) => note.notes);
  });

export const createNoteFn = createServerFn({ method: "POST" })
  .inputValidator(userIdSchema)
  .handler(async (req) => {
    const { userId } = req.data;
    const user = await getUserStatement.get({ userId });
    if (user === undefined) {
      throw new Error("User not found");
    }
    const tapeColor =
      TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)].value;
    const [note] = await db
      .insert(notesTable)
      .values({
        userId,
        tapeColor,
        content: "",
      })
      .returning();
    return note !== undefined;
  });

export const getNoteFn = createServerFn({ method: "GET" })
  .inputValidator(userAndNoteSchema)
  .handler(async (req) => {
    const { userId, noteId } = req.data;
    const result = await getUserNoteStatement.get({ userId, noteId });
    if (result === undefined) {
      throw new Error("Note or user not found");
    }
    // if (!result.user.subscribedTill || result.user.subscribedTill < new Date()) {
    //   throw new Error("User not subscribed");
    // }
    return result.note;
  });

export const updateNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ...userAndNoteSchema.shape,
      note: noteSchema,
    }),
  )
  .handler(async (req) => {
    const { userId, noteId, note } = req.data;
    const fetchedNote = await getUserNoteStatement.get({ userId, noteId });
    if (!fetchedNote) {
      throw new Error("Note not found");
    }
    const [updatedNote] = await db
      .update(notesTable)
      .set({
        content: note.content,
        tapeColor: note.tapeColor,
      })
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!updatedNote) {
      throw new Error("Note update failed");
    }
    return updatedNote;
  });

export const deleteNoteFn = createServerFn({ method: "POST" })
  .inputValidator(userAndNoteSchema)
  .handler(async (request) => {
    const { userId, noteId } = request.data;
    const deletedNote = await deleteNoteStatement.get({ userId, noteId });
    if (deletedNote === undefined) {
      throw new Error("Note not found");
    }
    return deletedNote;
  });

export const createUserFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      ...userIdSchema.shape,
      data: signupFormSchema,
    }),
  )
  .handler(async (request) => {
    const { data, userId } = request.data;
    const customer = await DodoPaymentsClient.customers.create({
      email: data.email,
      name: `${data.firstName} ${data.lastName}`,
    });
    const [user] = await db
      .insert(userTable)
      .values({
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        customerId: customer.customer_id,
        salt: generateSalt().toString("hex"),
      })
      .returning();
    return user;
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { TAPE_COLORS } from "@/data";
import { db } from "@/db";
import { notes as notesTable, user as userTable } from "@/db/schema";
import {
  deleteNoteStatement,
  getUserNoteStatement,
  getUserNotesStatement,
  getUserStatement,
} from "@/db/statements";
import { DodoPaymentsClient } from "@/integrations/dodopayments";
import { auth } from "@/lib/auth";
import { noteSchema } from "@/schema";

function checkUserSubscription(
  user: NonNullable<Awaited<ReturnType<typeof getUserStatement.get>>>,
) {
  if (user.subscribedTill === null) {
    const now = new Date();
    const thirtyDaysLater = new Date(
      user.createdAt.valueOf() + 30 * 24 * 60 * 60 * 1000,
    );
    if (now <= thirtyDaysLater) {
      return;
    }
    throw new Error("Trial period expired. Please subscribe to continue.");
  }
  if (user.subscribedTill < new Date()) {
    throw new Error("Subscription expired. Please renew to continue.");
  }
}

export const getNotesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest?.();
    const session = await auth.api.getSession({
      headers: request?.headers,
    });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const notes = await getUserNotesStatement.all({ userId });
    return notes.map((note) => note.notes);
  },
);

export const createNoteFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const request = getRequest?.();
    const session = await auth.api.getSession({
      headers: request?.headers,
    });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const user = await getUserStatement.get({ userId });
    if (user === undefined) {
      throw new Error("User not found");
    }
    checkUserSubscription(user);
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
  },
);

export const getNoteFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ noteId: z.string() }))
  .handler(async (req) => {
    const request = getRequest?.();
    const session = await auth.api.getSession({
      headers: request?.headers,
    });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const { noteId } = req.data;
    const result = await getUserNoteStatement.get({ userId, noteId });
    if (result === undefined) {
      throw new Error("Note or user not found");
    }
    checkUserSubscription(result.user);
    return result.note;
  });

export const updateNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      noteId: z.string(),
      note: noteSchema,
    }),
  )
  .handler(async (req) => {
    const request = getRequest?.();
    const session = await auth.api.getSession({
      headers: request?.headers,
    });
    if (!session) throw new Error("Unauthorized");
    const userId = session.user.id;
    const { noteId, note } = req.data;
    const fetchedNote = await getUserNoteStatement.get({ userId, noteId });
    if (!fetchedNote) {
      throw new Error("Note not found");
    }
    checkUserSubscription(fetchedNote.user);
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
  .inputValidator(z.object({ noteId: z.string() }))
  .handler(async (request) => {
    const req = getRequest?.();
    const session = await auth.api.getSession({
      headers: req?.headers,
    });
    if (!session) throw new Error("Unauthorized");

    const userId = session.user.id;
    const { noteId } = request.data;
    const deletedNote = await deleteNoteStatement.get({ userId, noteId });
    if (deletedNote === undefined) {
      throw new Error("Note not found");
    }
    return deletedNote;
  });

export const getUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest?.();
  const session = await auth.api.getSession({
    headers: request?.headers,
  });
  if (!session) throw new Error("Unauthorized");
  const userId = session.user.id;
  const user = await getUserStatement.get({ userId });
  if (!user) {
    throw new Error("User not found");
  }
  return user;
});

export const getCustomerPortalFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      customerId: z.string(),
    }),
  )
  .handler(async (request) => {
    const { customerId } = request.data;
    const res =
      await DodoPaymentsClient.customers.customerPortal.create(customerId);
    return res;
  });

export const getCheckoutSessionFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      customerId: z.string(),
    }),
  )
  .handler(async (request) => {
    const { customerId } = request.data;
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.customerId, customerId));
    if (user === undefined) {
      throw new Error("User not found");
    }
    const res = await DodoPaymentsClient.checkoutSessions.create({
      customer: {
        customer_id: customerId,
      },
      product_cart: [
        {
          product_id: "pdt_0NWd9SA5jGlOQIhWLPf83",
          quantity: 1,
        },
      ],
    });
    return res;
  });

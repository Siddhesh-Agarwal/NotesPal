import { createMiddleware, createServerFn } from "@tanstack/react-start";
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

/**
 * Middleware to ensure the user is authenticated.
 * Attaches the session and user to the function context.
 */
const authMiddleware = createMiddleware().server(async ({ next }) => {
  const request = getRequest?.();
  const session = await auth.api.getSession({
    headers: request?.headers,
  });

  if (!session) {
    throw new Error(
      "Unauthorized: You must be logged in to perform this action.",
    );
  }

  return next({
    context: {
      session,
      user: session.user,
    },
  });
});

/**
 * Middleware to ensure the user has an active subscription or is within the trial period.
 */
const subscriptionMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    const { user: sessionUser } = context;
    const user = await getUserStatement.get({ userId: sessionUser.id });

    if (!user) {
      throw new Error("User not found.");
    }

    if (user.subscribedTill === null) {
      const now = new Date();
      const thirtyDaysLater = new Date(
        user.createdAt.valueOf() + 30 * 24 * 60 * 60 * 1000,
      );
      if (now > thirtyDaysLater) {
        throw new Error("Trial period expired. Please subscribe to continue.");
      }
    } else if (user.subscribedTill < new Date()) {
      throw new Error("Subscription expired. Please renew to continue.");
    }

    return next({
      context: {
        ...context,
        dbUser: user,
      },
    });
  });

export const getNotesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const notes = await getUserNotesStatement.all({ userId });
    return notes.map((note) => note.notes);
  });

export const createNoteFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, subscriptionMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id;
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
  .middleware([authMiddleware, subscriptionMiddleware])
  .inputValidator(z.object({ noteId: z.string() }))
  .handler(async ({ data: { noteId }, context }) => {
    const userId = context.user.id;
    const result = await getUserNoteStatement.get({ userId, noteId });
    if (result === undefined) {
      throw new Error("Note not found or unauthorized access.");
    }
    return result.note;
  });

export const updateNoteFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware, subscriptionMiddleware])
  .inputValidator(
    z.object({
      noteId: z.string(),
      note: noteSchema.extend({
        encryptedKey: z.string().nullable().optional(),
        iv: z.string().nullable().optional(),
      }),
    }),
  )
  .handler(async ({ data: { noteId, note }, context }) => {
    const userId = context.user.id;
    const [updatedNote] = await db
      .update(notesTable)
      .set({
        content: note.content,
        tapeColor: note.tapeColor,
        encryptedKey: note.encryptedKey,
        iv: note.iv,
      })
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!updatedNote) {
      throw new Error("Note update failed or unauthorized access.");
    }
    return updatedNote;
  });

export const deleteNoteFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ noteId: z.string() }))
  .handler(async ({ data: { noteId }, context }) => {
    const userId = context.user.id;
    const deletedNote = await deleteNoteStatement.get({ userId, noteId });
    if (deletedNote === undefined) {
      throw new Error("Note not found or unauthorized access.");
    }
    return deletedNote;
  });

export const getUserFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const userId = context.user.id;
    const user = await getUserStatement.get({ userId });
    if (!user) {
      throw new Error("User not found.");
    }

    // Migration: Generate salt for existing users if missing
    if (!user.salt) {
      const { generateSalt } = await import("@/lib/encrypt");
      const salt = generateSalt();
      const base64Salt = btoa(String.fromCharCode(...salt));
      await db
        .update(userTable)
        .set({ salt: base64Salt })
        .where(eq(userTable.id, userId));
      user.salt = base64Salt;
    }

    return user;
  });

export const getCustomerPortalFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      customerId: z.string(),
    }),
  )
  .handler(async ({ data: { customerId }, context }) => {
    const user = await getUserStatement.get({ userId: context.user.id });
    if (!user || user.customerId !== customerId) {
      throw new Error("Unauthorized access to customer portal.");
    }
    const res =
      await DodoPaymentsClient.customers.customerPortal.create(customerId);
    return res;
  });

export const getCheckoutSessionFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      customerId: z.string(),
    }),
  )
  .handler(async ({ data: { customerId }, context }) => {
    const user = await getUserStatement.get({ userId: context.user.id });
    if (!user || user.customerId !== customerId) {
      throw new Error("Unauthorized access to checkout.");
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

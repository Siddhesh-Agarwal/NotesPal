import { env } from "cloudflare:workers";
import { zValidator } from "@hono/zod-validator";
import { Checkout } from "@polar-sh/hono";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import z from "zod";
import { TAPE_COLORS } from "@/data";
import { notesTable, userTable } from "@/db/schema";
import { env as parsedEnv } from "@/env";
import {
  createEncryptedNote,
  decryptNote,
  deriveMasterKey,
  encryptNoteContent,
  generateSalt,
} from "./lib/encrypt";

const app = new Hono();
const envIsDev = parsedEnv.environment === "development";
const server = envIsDev ? "sandbox" : "production";
app.use(
  cors({
    origin: parsedEnv.FRONTEND_URL,
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    maxAge: 86400,
  }),
);
app.use(
  csrf({
    origin: parsedEnv.FRONTEND_URL,
    secFetchSite: "same-origin",
  }),
);

const db = drizzle(env.D1);

const getByUserSchema = z.object({
  userId: z.string(),
});

const getByUserAndNoteSchema = z.object({
  userId: z.string(),
  noteId: z.string(),
});

app.get(
  "/checkout",
  Checkout({
    accessToken: env.POLAR_ACCESS_TOKEN,
    successUrl: `${env.FRONTEND_URL}/success?checkout_id={CHECKOUT_ID}`,
    includeCheckoutId: true,
    server,
  }),
);

app.get("/notes/:userId", zValidator("param", getByUserSchema), async (c) => {
  const { userId } = c.req.valid("param");
  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));
  if (!user) {
    return c.json({ message: "User not found" }, 404);
  }
  const masterKey = await deriveMasterKey(
    user.id,
    Buffer.from(user.salt, "hex"),
  );
  const data = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId));

  const decrypted = data.map((note) => {
    const { encryptedContent, encryptionKey, iv } = note;
    const decryptedContent = decryptNote(
      encryptedContent,
      encryptionKey,
      iv,
      masterKey,
    );
    return {
      id: note.id,
      content: decryptedContent,
      tapeColor: note.tapeColor,
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    };
  });
  return c.json(decrypted);
});

app.post("/note/:userId", zValidator("param", getByUserSchema), async (c) => {
  const { userId } = c.req.valid("param");
  let [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId));
  if (!user) {
    [user] = await db
      .insert(userTable)
      .values({
        id: userId,
        salt: generateSalt(),
      })
      .returning();
  }
  const tapeColor =
    TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)].value;
  const masterKey = await deriveMasterKey(
    user.id,
    Buffer.from(user.salt, "hex"),
  );
  const encrypted = createEncryptedNote("", masterKey);
  const [note] = await db
    .insert(notesTable)
    .values({
      userId,
      encryptedContent: encrypted.encryptedContent,
      encryptionKey: encrypted.encryptedKey,
      iv: encrypted.iv,
      tapeColor,
    })
    .returning();
  return c.json(note);
});

app.get(
  "/note/:userId/:noteId",
  zValidator("param", getByUserAndNoteSchema),
  async (c) => {
    const { userId, noteId } = c.req.valid("param");
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    const [note] = await db
      .select()
      .from(notesTable)
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }
    const masterKey = await deriveMasterKey(
      userId,
      Buffer.from(user.salt, "hex"),
    );
    const decrypted = decryptNote(
      note.encryptedContent,
      note.encryptionKey,
      note.iv,
      masterKey,
    );
    return c.json({
      id: note.id,
      content: decrypted,
      tapeColor: note.tapeColor,
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    });
  },
);

app.delete(
  "/note/:userId/:noteId",
  zValidator("param", getByUserAndNoteSchema),
  async (c) => {
    const { userId, noteId } = c.req.valid("param");
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    const [note] = await db
      .delete(notesTable)
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }
    return c.json({ message: "Note deleted successfully" });
  },
);

app.put(
  "/note/:userId/:noteId",
  zValidator("param", getByUserAndNoteSchema),
  zValidator(
    "json",
    z.object({
      content: z.string(),
      tapeColor: z.string().min(7).max(7),
    }),
  ),
  async (c) => {
    const { userId, noteId } = c.req.valid("param");
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    const [note] = await db
      .select()
      .from(notesTable)
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }
    const json = c.req.valid("json");
    const content = encryptNoteContent(
      json.content,
      Buffer.from(note.encryptionKey, "hex"),
    );
    const [updatedNote] = await db
      .update(notesTable)
      .set({
        encryptedContent: content.encryptedContent,
        iv: content.iv,
        tapeColor: json.tapeColor,
      })
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!updatedNote) {
      return c.json({ message: "Note update failed" }, 404);
    }
    return c.json(updatedNote);
  },
);

export default app;

import { TAPE_COLORS } from "@/data";
import { notesTable } from "@/db/schema";
import { env } from "@/env";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { Hono } from "hono";
import z from "zod";

const app = new Hono();
const db = drizzle(env.DATABASE_URL);

const getByUserSchema = z.object({
  userId: z.string(),
});

const getByUserAndNoteSchema = z.object({
  userId: z.string(),
  noteId: z.string(),
});

app.get("/notes/:userId", zValidator("param", getByUserSchema), async (c) => {
  const { userId } = c.req.valid("param");
  const data = await db
    .select({
      id: notesTable.id,
      content: notesTable.content,
      tapeColor: notesTable.tapeColor,
      createdAt: notesTable.createdAt,
      updatedAt: notesTable.updatedAt,
    })
    .from(notesTable)
    .where(eq(notesTable.userId, userId));
  return c.json(data);
});

app.post("/notes/:userId", zValidator("param", getByUserSchema), async (c) => {
  const { userId } = c.req.valid("param");
  const tapeColor =
    TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)].value;
  const [note] = await db
    .insert(notesTable)
    .values({
      userId,
      content: "",
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
    const [note] = await db
      .select()
      .from(notesTable)
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }
    return c.json(note);
  },
);

app.delete(
  "/note/:userId/:noteId",
  zValidator("param", getByUserAndNoteSchema),
  async (c) => {
    const { userId, noteId } = c.req.valid("param");
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
    const json = c.req.valid("json");
    const [note] = await db
      .update(notesTable)
      .set({ content: json.content, tapeColor: json.tapeColor })
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!note) {
      return c.json({ message: "Note not found" }, 404);
    }
    return c.json(note);
  },
);

export default app;

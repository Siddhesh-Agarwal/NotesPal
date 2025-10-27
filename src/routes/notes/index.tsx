import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
} from "@clerk/tanstack-react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { LogIn, PlusIcon, UserXIcon } from "lucide-react";
import z from "zod";
import { NoteCard, TAPE_COLORS } from "@/components/note";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/db";
import { notesTable, userTable } from "@/db/schema";
import {
  createEncryptedNote,
  decryptNote,
  deriveMasterKey,
} from "@/lib/encrypt";

export const Route = createFileRoute("/notes/")({
  component: RouteComponent,
});

const getNotesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async (req) => {
    const { userId } = req.data;
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));
    if (!user) {
      throw new Error("User not found");
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
    return decrypted;
  });

const createNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
    }),
  )
  .handler(async (req) => {
    const { userId } = req.data;
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, userId));
    if (!user) {
      throw new Error("User not found");
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
    return note;
  });

const deleteNoteFn = createServerOnlyFn(async ({ userId, noteId }) => {
  const [deletedNote] = await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
    .returning();
  if (!deletedNote) {
    throw new Error("Note not found");
  }
  return deletedNote;
});

function RouteComponent() {
  const { isLoaded, userId } = useAuth();
  const {
    data: notes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notes", userId],
    queryFn: () => getNotesFn({ data: { userId: userId || "" } }),
    enabled: !!userId,
  });
  const { mutateAsync: deleteNoteAsync } = useMutation({
    mutationKey: ["deleteNote", userId],
    mutationFn: ({ id }: { id: string }) =>
      deleteNoteFn({ userId: userId || "", noteId: id }),
    onSuccess: () => refetch(),
  });
  const { mutateAsync: createNoteAsync } = useMutation({
    mutationKey: ["createNote", userId],
    mutationFn: () => createNoteFn({ data: { userId: userId || "" } }),
    onSuccess: () => refetch(),
  });

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center">
          <Spinner />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <SignedOut>
        <div className="grid place-items-center h-screen">
          <div className="max-w-lg w-full">
            <Alert variant={"destructive"}>
              <UserXIcon />
              <AlertTitle className="font-semibold">
                You are not logged in!
              </AlertTitle>
              <AlertDescription>
                Please sign in to access this note.
              </AlertDescription>
            </Alert>
          </div>
          <SignInButton>
            <Button className="gap-2">
              <LogIn />
              Sign In
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">My Notes</h1>
            <Button
              onClick={async () => await createNoteAsync()}
              className="bg-blue-600 hover:bg-blue-400 text-white"
            >
              <PlusIcon size={20} />
              New Note
            </Button>
          </div>
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-4">
                <Spinner />
                <span>Loading notes...</span>
              </p>
            </div>
          ) : notes === undefined ? (
            <Alert variant={"destructive"}>
              <AlertTitle>Cannot load notes</AlertTitle>
              <AlertDescription>
                Something went wrong while loading your notes.
              </AlertDescription>
            </Alert>
          ) : notes.length === 0 ? (
            <Alert variant={"destructive"}>
              <AlertTitle>No notes yet</AlertTitle>
              <AlertDescription>
                Create your first note to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {notes.map((note) => (
                <Link to={`/notes/${note.id}`} key={note.id}>
                  <NoteCard
                    key={note.id}
                    note={note}
                    onDelete={async () =>
                      await deleteNoteAsync({ id: note.id })
                    }
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </SignedIn>
    </div>
  );
}

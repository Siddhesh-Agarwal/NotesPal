import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { DollarSign, LogOutIcon, PlusIcon, UserIcon } from "lucide-react";
import { useEffect } from "react";
import z from "zod";
import { NoteCard, TAPE_COLORS } from "@/components/note";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/db";
import { notesTable, userTable } from "@/db/schema";
import {
  createEncryptedNote,
  decryptNote,
  deriveMasterKey,
} from "@/lib/encrypt";
import { useStore } from "@/store";

export const Route = createFileRoute("/notes")({
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
      throw new Error("User not found. Please sign up or log in.");
    }
    if (!user.subscribedTill || user.subscribedTill < new Date()) {
      throw new Error(
        "User has not subscribed. Please subscribe to create/read your notes.",
      );
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
    return note !== undefined;
  });

const deleteNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      noteId: z.string(),
    }),
  )
  .handler(async (request) => {
    const { userId, noteId } = request.data;
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
  // const { isLoaded, user } = useUser();
  // const { userId, resetUser, firstName, lastName, email } = useStore();
  const { resetUser } = useStore();
  const { userId } = useAuth();
  const { user, isSignedIn, isLoaded } = useUser();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const {
    data: notes,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ["notes", userId],
    queryFn: () => getNotesFn({ data: { userId: userId || "" } }),
    enabled: !!userId,
  });
  const { mutateAsync: deleteNoteAsync } = useMutation({
    mutationKey: ["deleteNote", userId],
    mutationFn: ({ id }: { id: string }) =>
      deleteNoteFn({ data: { userId: userId || "", noteId: id } }),
    onSuccess: () => refetch(),
  });
  const { mutateAsync: createNoteAsync } = useMutation({
    mutationKey: ["createNote", userId],
    mutationFn: () => createNoteFn({ data: { userId: userId || "" } }),
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      navigate({ to: "/auth/sign-in" });
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (isLoading) {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex gap-2 text-foreground">
          <Spinner />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto h-full">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">My Notes</h1>
          <div className="flex gap-4">
            <Button
              onClick={async () => await createNoteAsync()}
              className="bg-blue-600 hover:bg-blue-400 text-white"
            >
              <PlusIcon size={20} />
              New Note
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <Avatar className="outline">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${user?.primaryEmailAddress?.emailAddress}`}
                  />
                  <AvatarFallback>
                    {`${user?.firstName || ""}${user?.lastName || ""}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => {}}>
                  <DollarSign />
                  Manage Subscription
                </DropdownMenuItem>
                <Link to="/profile">
                  <DropdownMenuItem className="gap-2">
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={async () => {
                    resetUser();
                    await signOut();
                  }}
                >
                  <LogOutIcon />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {error || notes === undefined ? (
          <Alert variant={"destructive"}>
            <AlertTitle className="text-2xl">Cannot load notes</AlertTitle>
            <AlertDescription className="text-base">
              {error?.message ||
                "Something went wrong while loading your notes."}
            </AlertDescription>
          </Alert>
        ) : notes.length === 0 ? (
          <Alert variant={"destructive"}>
            <AlertTitle className="text-2xl">No notes yet</AlertTitle>
            <AlertDescription className="text-base">
              Create your first note to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {notes.map((note) => (
              <Link
                to="/note/$noteId"
                params={{
                  noteId: note.id,
                }}
                key={note.id}
              >
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={async () => await deleteNoteAsync({ id: note.id })}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

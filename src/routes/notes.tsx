import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import {
  DollarSign,
  LogOutIcon,
  PlusIcon,
  RefreshCcwIcon,
  UserIcon,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { NoteCard, TAPE_COLORS } from "@/components/note";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { queryClient } from "@/integrations/query";
import { getAvatarUrl } from "@/lib/avatar";
import {
  createEncryptedNote,
  decryptNote,
  deriveMasterKey,
} from "@/lib/encrypt";

export const Route = createFileRoute("/notes")({
  component: RouteComponent,
});

const getNotesFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async (req) => {
    const { userId } = req.data;
    const notes = await db
      .select()
      .from(notesTable)
      .innerJoin(userTable, eq(notesTable.userId, userTable.id))
      .where(eq(userTable.id, userId));
    const decryptedNotes = notes.map(async (note) => {
      const { notes, users } = note;
      const masterKey = await deriveMasterKey({
        password: users.id,
        salt: Buffer.from(users.salt, "hex"),
      });
      const { encryptedContent, encryptionKey, iv } = notes;
      const decryptedContent = decryptNote(
        encryptedContent,
        encryptionKey,
        iv,
        masterKey,
      );
      return {
        id: notes.id,
        content: decryptedContent,
        tapeColor: notes.tapeColor,
        updatedAt: notes.updatedAt,
        createdAt: notes.createdAt,
      };
    });
    return Promise.all(decryptedNotes);
  });

const createNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().min(1),
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
    const masterKey = await deriveMasterKey({
      password: user.id,
      salt: Buffer.from(user.salt, "hex"),
    });
    const encrypted = createEncryptedNote({ content: "", masterKey });
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
    onSuccess: () => refetchNotes(),
  });
  const { mutateAsync: createNoteAsync } = useMutation({
    mutationKey: ["createNote", userId],
    mutationFn: () =>
      createNoteFn({ data: { userId: userId || "" } }).then((val) => {
        if (!val) {
          toast.error("Failed to create note");
        }
      }),
    onSuccess: () => refetchNotes(),
  });
  const isMobile = useIsMobile();

  async function refetchNotes() {
    await queryClient.invalidateQueries({
      queryKey: ["notes", userId],
    });
    await refetch();
  }

  const emailAddress = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      navigate({ to: "/auth/sign-in" });
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (isLoading) {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
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
            <ButtonGroup>
              <Button
                size={isMobile ? "icon" : "default"}
                variant="default"
                onClick={async () => await refetchNotes()}
                disabled={!emailAddress}
              >
                <RefreshCcwIcon />
                <span className="hidden md:inline-flex">Refresh</span>
              </Button>
              <ButtonGroupSeparator />
              <Button
                size={isMobile ? "icon" : "default"}
                variant="secondary"
                onClick={async () => await createNoteAsync()}
                disabled={!emailAddress}
              >
                <PlusIcon size={20} />
                <span className="hidden md:inline-flex">New Note</span>
              </Button>
            </ButtonGroup>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                disabled={!emailAddress}
              >
                <Avatar className="outline">
                  <AvatarImage src={getAvatarUrl({ email: emailAddress })} />
                  <AvatarFallback>
                    {`${user?.firstName?.charAt(0) ?? ""}${user?.lastName?.charAt(0) ?? ""}`.toUpperCase()}
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
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => navigate({ to: "/profile" })}
                >
                  <UserIcon />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={async () => await signOut()}
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

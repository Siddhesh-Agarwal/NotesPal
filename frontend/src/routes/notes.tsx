import { NoteCard } from "@/components/note";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Note } from "@/types/note";
import { BACKEND_BASE_URL } from "@/utils/const";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon, UserXIcon } from "lucide-react";

export const Route = createFileRoute("/notes")({
  component: RouteComponent,
});

async function getNotes({ userId }: { userId?: string }): Promise<Note[]> {
  if (!userId) throw new Error("User ID is required");
  const response = await fetch(`${BACKEND_BASE_URL}/notes/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  return response.json();
}

async function deleteNote({
  userId,
  noteId,
}: {
  userId?: string;
  noteId: string;
}): Promise<void> {
  if (!userId) throw new Error("User ID is required");
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}/${noteId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete note");
  }
}

async function createNote({ userId }: { userId?: string }): Promise<Note> {
  if (!userId) throw new Error("User ID is required");
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to create note");
  }
  return response.json();
}

function RouteComponent() {
  const { isLoaded, userId } = useAuth();
  const {
    data: notes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["notes", userId],
    queryFn: () => getNotes({ userId: userId || "" }),
    enabled: !!userId,
  });
  const { mutateAsync: deleteNoteAsync } = useMutation({
    mutationKey: ["deleteNote", userId],
    mutationFn: ({ id }: { id: string }) =>
      deleteNote({ userId: userId || "", noteId: id }),
    onSuccess: () => refetch(),
  });
  const { mutateAsync: createNoteAsync } = useMutation({
    mutationKey: ["createNote", userId],
    mutationFn: () => createNote({ userId: userId || "" }),
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
    <>
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
        </div>
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-8">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
      </SignedIn>
    </>
  );
}

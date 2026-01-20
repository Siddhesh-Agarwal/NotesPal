import { useClerk } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  DollarSignIcon,
  LogOutIcon,
  NotepadTextIcon,
  PlusIcon,
  RefreshCcwIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { NoteCard } from "@/components/note";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { createNoteFn, deleteNoteFn, getNotesFn } from "@/functions";
import { useIsMobile } from "@/hooks/use-mobile";
import { queryClient } from "@/integrations/query";
import { getAvatarUrl } from "@/lib/avatar";

export const Route = createFileRoute("/notes")({
  component: RouteComponent,
});

function RouteComponent() {
  const { signOut, isSignedIn, user } = useClerk();
  const emailAddress = user?.primaryEmailAddress?.emailAddress;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    data: notes,
    status: notesStatus,
    refetch: notesRefetch,
    error: notesError,
  } = useQuery({
    queryKey: ["notes", user?.id],
    queryFn: () => getNotesFn({ data: { userId: user?.id ?? "" } }),
    enabled: !!user?.id,
  });
  const { mutateAsync: deleteNoteAsync } = useMutation({
    mutationKey: ["deleteNote", user?.id],
    mutationFn: ({ id }: { id: string }) =>
      deleteNoteFn({ data: { userId: user?.id ?? "", noteId: id } }),
    onSuccess: () => refetchNotes(),
  });
  const { mutateAsync: createNoteAsync, status: createNoteStatus } =
    useMutation({
      mutationKey: ["createNote", user?.id],
      mutationFn: () =>
        createNoteFn({ data: { userId: user?.id ?? "" } }).then((val) => {
          if (!val) {
            toast.error("Failed to create note");
          }
        }),
      onSuccess: () => refetchNotes(),
    });

  async function refetchNotes() {
    await queryClient.invalidateQueries({
      queryKey: ["notes", user?.id],
    });
    await notesRefetch();
  }

  if (!isSignedIn) {
    navigate({ to: "/auth/sign-in" });
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
                variant="outline"
                onClick={async () => await refetchNotes()}
                disabled={!emailAddress}
              >
                <RefreshCcwIcon />
                <span className="hidden md:inline-flex">Refresh</span>
              </Button>
              <ButtonGroupSeparator />
              <Button
                size={isMobile ? "icon" : "default"}
                variant="outline"
                onClick={async () => await createNoteAsync()}
                disabled={!emailAddress || createNoteStatus === "pending"}
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
                  <DollarSignIcon />
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
        {notesStatus === "pending" ? (
          <div className="bg-background flex justify-center items-center h-full">
            <div className="flex gap-2 text-foreground items-center">
              <Spinner />
              <span className="text-xl">Loading...</span>
            </div>
          </div>
        ) : notesStatus === "error" ? (
          <Alert variant={"destructive"}>
            <AlertTitle className="text-2xl">Cannot load notes</AlertTitle>
            <AlertDescription className="text-base">
              {notesError.message}
            </AlertDescription>
          </Alert>
        ) : notes.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NotepadTextIcon />
              </EmptyMedia>
              <EmptyTitle>No notes yet</EmptyTitle>
              <EmptyDescription className="text-base">
                Create your first note to get started.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="secondary"
                onClick={async () => await createNoteAsync()}
                disabled={!emailAddress || createNoteStatus === "pending"}
              >
                <PlusIcon />
                Create a note
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {notes.map((note) => (
              <Link
                to="/note/$noteId"
                key={note.id}
                params={{
                  noteId: note.id,
                }}
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

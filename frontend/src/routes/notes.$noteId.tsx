import { useAuth } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  PaletteIcon,
  TicketSlashIcon,
  UserXIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import MarkdownPreview from "@/components/markdown-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/types/note";
import { BACKEND_BASE_URL, TAPE_COLORS } from "@/utils/const";
import { useMutation, useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/notes/$noteId")({
  component: RouteComponent,
});

async function getNoteFn(
  noteId: string,
  userId: string,
): Promise<Note | undefined> {
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}/${noteId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch note: ${response.status}`);
  }
  return response.json();
}

async function updateNoteFn(
  noteId: string,
  userId: string,
  note: { content: string; tapeColor: string },
): Promise<void> {
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}/${noteId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: note.content,
      tapeColor: note.tapeColor,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update note: ${response.status}`);
  }
}

function RouteComponent() {
  const { isLoaded, userId } = useAuth();
  const { noteId } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNoteFn(noteId, userId || ""),
    enabled: !!noteId && !!userId,
  });
  const { mutate: updateNote } = useMutation({
    mutationFn: (note: { content: string; tapeColor: string }) =>
      updateNoteFn(noteId, userId || "", note),
  });
  const [note, setNote] = useState<Note | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (data) {
      setNote(data);
    }
  }, [data]);

  useEffect(() => {
    if (!note) return;
    updateNote({
      content: note.content,
      tapeColor: note.tapeColor,
    });
  }, [note?.content, note?.tapeColor]);

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

  if (!userId) {
    return (
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
    );
  }

  if (!note) {
    return (
      <div className="grid place-items-center h-screen">
        <div>
          <Alert variant={"destructive"}>
            <TicketSlashIcon />
            <AlertTitle className="font-semibold">Note not found!</AlertTitle>
            <AlertDescription>
              The note you are trying to access does not exist.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-5 to-chart-4 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link to="/">
            <Button variant={"ghost"}>
              <ArrowLeftIcon size={20} />
            </Button>
          </Link>
          <div className="flex gap-2">
            <div className="relative">
              <ButtonGroup>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button className="w-36">
                      <PaletteIcon size={18} />
                      Tape Color
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-background">
                    <div className="grid grid-cols-4 gap-2 z-10">
                      {TAPE_COLORS.map((color) => (
                        <Button
                          key={color.value}
                          onClick={() =>
                            setNote({ ...note, tapeColor: color.value })
                          }
                          size={"icon-lg"}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <ButtonGroupSeparator />
                <Button
                  onClick={() => setIsPreview((val) => !val)}
                  className="w-36"
                >
                  {isPreview ? (
                    <>
                      <EyeOffIcon size={18} />
                      Edit
                    </>
                  ) : (
                    <>
                      <EyeIcon size={18} />
                      Preview
                    </>
                  )}
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>

        <div
          className="bg-white rounded-sm shadow-2xl p-8 relative font-serif"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)",
            minHeight: "600px",
          }}
        >
          <div
            className="absolute top-0 left-16 w-24 h-12 opacity-70 -translate-y-3"
            style={{ backgroundColor: note.tapeColor }}
          />
          <div
            className="absolute top-0 left-0 w-3 h-full opacity-30"
            style={{ backgroundColor: note.tapeColor }}
          />

          {isPreview ? (
            <MarkdownPreview markdown={note.content} size="md" />
          ) : (
            <Textarea
              value={note.content}
              onChange={(e) => setNote({ ...note, content: e.target.value })}
              className="w-full h-full bg-transparent border-none outline-none resize-none text-foreground font-mono"
              style={{
                lineHeight: "32px",
                minHeight: "500px",
              }}
              placeholder="# Start writing your note...

  Use markdown syntax:
  **bold** or __bold__
  *italic* or _italic_
  `code`

  # Header 1
  ## Header 2
  ### Header 3"
            />
          )}
        </div>
      </div>
    </div>
  );
}

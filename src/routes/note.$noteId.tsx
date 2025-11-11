import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  PaletteIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import MarkdownPreview from "@/components/markdown-preview";
import { TAPE_COLORS } from "@/components/note";
import NotFoundPage from "@/components/page/not-found";
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
import { db } from "@/db";
import { notesTable, userTable } from "@/db/schema";
import { queryClient } from "@/integrations/query";
import {
  decryptNote,
  deriveMasterKey,
  encryptNoteContent,
} from "@/lib/encrypt";
import { useStore } from "@/store";
import type { Note } from "@/types/note";

export const Route = createFileRoute("/note/$noteId")({
  component: RouteComponent,
});

const getNoteFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      noteId: z.string(),
      userId: z.string(),
    }),
  )
  .handler(async (req) => {
    const { userId, noteId } = req.data;
    const [result] = await db
      .select({
        note: notesTable,
        user: userTable,
      })
      .from(notesTable)
      .innerJoin(userTable, eq(notesTable.userId, userTable.id))
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
    if (!result) {
      throw new Error("Note or user not found");
    }
    const { note, user } = result;
    // if (!user.subscribedTill || user.subscribedTill < new Date()) {
    //   throw new Error("User not subscribed");
    // }
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
    return {
      id: note.id,
      content: decrypted,
      tapeColor: note.tapeColor,
      updatedAt: note.updatedAt,
      createdAt: note.createdAt,
    };
  });

const updateNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      noteId: z.string(),
      userId: z.string(),
      note: z.object({
        content: z.string(),
        tapeColor: z.string(),
      }),
    }),
  )
  .handler(async (req) => {
    const { userId, noteId, note } = req.data;
    const [fetchedNote] = await db
      .select({ encryptionKey: notesTable.encryptionKey })
      .from(notesTable)
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)));
    if (!fetchedNote) {
      throw new Error("Note not found");
    }
    const content = encryptNoteContent(
      note.content,
      Buffer.from(fetchedNote.encryptionKey, "hex"),
    );
    const [updatedNote] = await db
      .update(notesTable)
      .set({
        encryptedContent: content.encryptedContent,
        iv: content.iv,
        tapeColor: note.tapeColor,
      })
      .where(and(eq(notesTable.id, noteId), eq(notesTable.userId, userId)))
      .returning();
    if (!updatedNote) {
      throw new Error("Note update failed");
    }
    return updatedNote;
  });

function RouteComponent() {
  const { noteId } = Route.useParams();
  const { userId } = useStore();
  const {
    data,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNoteFn({ data: { userId: userId || "", noteId } }),
    enabled: !!noteId && !!userId,
  });
  const {
    mutate: updateNote,
    isPending,
    error: saveError,
  } = useMutation({
    mutationFn: (note: { content: string; tapeColor: string }) =>
      updateNoteFn({ data: { noteId, userId: userId || "", note } }),
    onSuccess: () => {
      pendingUpdateRef.current = null;
      queryClient.invalidateQueries({ queryKey: ["note", noteId] }).then(() => {
        toast.success("Note updated");
      });
    },
  });
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Pick<Note, "content" | "tapeColor"> | null>(
    null,
  );
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (!isSignedIn && isLoaded) {
      navigate({ to: "/auth/sign-in" });
    }
  }, [isSignedIn, isLoaded, navigate]);

  // Initialize note from query data
  useEffect(() => {
    if (data && !pendingUpdateRef.current) {
      setNote(data);
    }
  }, [data]);

  // Debounced save with 1 second delay
  useEffect(() => {
    if (!note || !data) return;

    // Check if note actually changed
    if (note.content === data.content && note.tapeColor === data.tapeColor) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Store pending update
    pendingUpdateRef.current = {
      content: note.content,
      tapeColor: note.tapeColor,
    };

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      if (pendingUpdateRef.current) {
        updateNote(pendingUpdateRef.current);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [note, data, updateNote]);

  // Save on unmount if there's a pending update
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        updateNote(pendingUpdateRef.current);
      }
    };
  }, [updateNote]);

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNote((prev) => (prev ? { ...prev, content: e.target.value } : null));
    },
    [],
  );

  const handleColorChange = useCallback((color: string) => {
    setNote((prev) => (prev ? { ...prev, tapeColor: color } : null));
  }, []);

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

  if (!userId) {
    return <NotFoundPage backTo="/" />;
  }

  if (fetchError || !note) {
    return <NotFoundPage backTo="/notes" />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-chart-5 to-chart-4 p-8">
      <div className="max-w-4xl mx-auto">
        {saveError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Save Failed</AlertTitle>
            <AlertDescription>
              {saveError.message ||
                "Failed to save your note. Your changes may be lost."}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <Link to="/notes">
            <Button variant={"ghost"}>
              <ArrowLeftIcon size={20} />
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
            {isPending && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                Saving...
              </span>
            )}
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
                          onClick={() => handleColorChange(color.value)}
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
              onChange={handleContentChange}
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

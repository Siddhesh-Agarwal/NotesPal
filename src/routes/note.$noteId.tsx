import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  PaletteIcon,
  ShieldCheckIcon,
  UnlockIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import MarkdownPreview from "@/components/markdown-preview";
import NotFoundPage from "@/components/page/not-found";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { TAPE_COLORS } from "@/data";
import { getNoteFn, getUserFn, updateNoteFn } from "@/functions";
import { queryClient } from "@/integrations/query";
import { authClient } from "@/lib/auth-client";
import {
  createEncryptedNote,
  decryptNote,
  deriveMasterKey,
} from "@/lib/encrypt";
import type { Note } from "@/types";

export const Route = createFileRoute("/note/$noteId")({
  component: RouteComponent,
});

const formSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

function RouteComponent() {
  const { noteId } = Route.useParams();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const sessionUser = session?.user;
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "" },
  });

  function onSubmit(values: FormValues) {
    handlePasswordSubmit(values.password);
  }

  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { data: dbUser, isPending: isUserPending } = useQuery({
    queryKey: ["user", sessionUser?.id],
    queryFn: () => getUserFn(),
    enabled: !!sessionUser?.id,
  });

  const {
    data,
    status: noteStatus,
    error: noteError,
  } = useQuery({
    queryKey: ["note", noteId],
    queryFn: () => getNoteFn({ data: { noteId } }),
    enabled: !!noteId && !!sessionUser?.id,
  });

  const {
    mutate: updateNote,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: (noteUpdate: {
      content: string;
      tapeColor: string;
      encryptedKey?: string | null;
      iv?: string | null;
    }) => updateNoteFn({ data: { noteId, note: noteUpdate } }),
    onSuccess: () => {
      pendingUpdateRef.current = null;
      queryClient.invalidateQueries({ queryKey: ["note", noteId] }).then(() => {
        toast.success("Note updated");
      });
    },
  });

  const [note, setNote] = useState<Note | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<Pick<
    Note,
    "content" | "tapeColor" | "encryptedKey" | "iv"
  > | null>(null);

  const decryptAndSetNote = useCallback(
    async (encryptedNote: Note, key: CryptoKey) => {
      setIsDecrypting(true);
      try {
        if (encryptedNote.encryptedKey === null || encryptedNote.iv === null) {
          throw new Error("Cannot decrypt a note that is not encrypted");
        }
        const decryptedContent = await decryptNote(
          encryptedNote.content,
          encryptedNote.encryptedKey,
          encryptedNote.iv,
          key,
        );
        setNote({ ...encryptedNote, content: decryptedContent });
      } catch (err) {
        console.error(err);
        toast.error("Invalid master password or corrupted note data.");
        setShowPasswordDialog(true);
      } finally {
        setIsDecrypting(false);
      }
    },
    [],
  );

  async function handlePasswordSubmit(password: string) {
    if (!dbUser?.salt || !password) return;

    try {
      setIsDecrypting(true);
      const saltBuffer = new Uint8Array(
        atob(dbUser.salt)
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const key = await deriveMasterKey({
        password,
        salt: saltBuffer,
      });
      setMasterKey(key);
      setShowPasswordDialog(false);

      if (data?.encryptedKey && data?.iv) {
        await decryptAndSetNote(data, key);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to derive master key");
    } finally {
      setIsDecrypting(false);
    }
  }

  // Initialize note from query data and decrypt if needed
  useEffect(() => {
    if (data) {
      if (data.encryptedKey && data.iv) {
        if (masterKey) {
          decryptAndSetNote(data, masterKey);
        } else {
          setShowPasswordDialog(true);
          setNote(data); // Set the encrypted note for now
        }
      } else {
        setNote(data);
      }
    }
  }, [data, masterKey, decryptAndSetNote]);

  // Debounced save with 1 second delay
  useEffect(() => {
    if (!note || !data || isDecrypting) return;

    // Don't save if note is still encrypted and we're waiting for password
    if (note.encryptedKey && !masterKey) return;

    // Check if note actually changed
    const hasContentChanged = note.content !== data.content;
    const hasColorChanged = note.tapeColor !== data.tapeColor;
    const isNowEncrypted = !!note.encryptedKey;
    const wasEncrypted = !!data.encryptedKey;

    if (
      !hasContentChanged &&
      !hasColorChanged &&
      isNowEncrypted === wasEncrypted
    ) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      let updatePayload = {
        content: note.content,
        tapeColor: note.tapeColor,
        encryptedKey: note.encryptedKey,
        iv: note.iv,
      };

      if (masterKey && (hasContentChanged || !wasEncrypted)) {
        // Encrypt content before sending to server
        const { encryptedContent, encryptedKey, iv } =
          await createEncryptedNote({
            content: note.content,
            masterKey,
          });
        updatePayload = {
          ...updatePayload,
          content: encryptedContent,
          encryptedKey,
          iv,
        };
      } else if (!masterKey && wasEncrypted) {
        // This shouldn't happen if UI prevents editing without masterKey
        return;
      }

      pendingUpdateRef.current = updatePayload;
      updateNote(updatePayload);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [note, data, masterKey, isDecrypting, updateNote]);

  // Save on unmount if there's a pending update
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        updateNote(pendingUpdateRef.current);
      }
    };
  }, [updateNote]);

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setNote((prev) => (prev ? { ...prev, content: e.target.value } : null));
  }

  function handleColorChange(color: string) {
    setNote((prev) => (prev ? { ...prev, tapeColor: color } : null));
  }

  async function toggleEncryption() {
    if (!masterKey) {
      setShowPasswordDialog(true);
      return;
    }

    if (note?.encryptedKey) {
      // Disable encryption: note is already decrypted in state, just clear keys
      setNote((prev) =>
        prev ? { ...prev, encryptedKey: null, iv: null } : null,
      );
      toast.info(
        "Encryption disabled for this note. It will be saved in plain text.",
      );
    } else {
      // Enable encryption: mark it as encrypted (save will handle the actual encryption)
      setNote((prev) =>
        prev ? { ...prev, encryptedKey: "pending", iv: "pending" } : null,
      );
      toast.success("Encryption enabled for this note.");
    }
  }

  if (isSessionPending || noteStatus === "pending" || isUserPending) {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
          <Spinner />
          <span className="text-xl">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    navigate({ to: "/auth/sign-in" });
    return null;
  }

  if (note === null && noteStatus !== "error") {
    return <NotFoundPage backTo="/notes" />;
  }

  if (noteStatus === "error") {
    return (
      <div className="bg-background flex justify-center items-center h-screen">
        <div className="flex flex-col gap-2 text-foreground items-center">
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{noteError.message}</AlertDescription>
          </Alert>
          <Link to="/notes">
            <Button variant="outline">Back to Notes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isEncrypted = !!note?.encryptedKey;
  const isLocked = isEncrypted && !masterKey;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Master Password</DialogTitle>
              <DialogDescription>
                Your master password is required to encrypt or decrypt this
                note. It is never sent to our servers.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Master Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Your secret passphrase"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="gap-2">
                  <UnlockIcon />
                  Unlock
                </Button>
              </form>
            </Form>
            <DialogFooter></DialogFooter>
          </DialogContent>
        </Dialog>

        {saveError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Save Failed</AlertTitle>
            <AlertDescription>{saveError.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <Link to="/notes">
            <Button variant={"ghost"}>
              <ArrowLeftIcon size={20} />
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Spinner className="w-4 h-4" />
                Saving...
              </span>
            )}
            <div className="relative">
              <ButtonGroup>
                <Button
                  onClick={toggleEncryption}
                  variant={isEncrypted ? "default" : "outline"}
                  className="w-12"
                  title={
                    isEncrypted ? "Encryption Enabled" : "Enable Encryption"
                  }
                >
                  {isEncrypted ? (
                    <ShieldCheckIcon size={18} className="text-green-400" />
                  ) : (
                    <LockIcon size={18} />
                  )}
                </Button>
                <ButtonGroupSeparator />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-36"
                      style={{ backgroundColor: note?.tapeColor }}
                      disabled={isLocked}
                    >
                      <PaletteIcon size={18} />
                      Tape Color
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-background">
                    <div className="grid grid-cols-4 gap-2">
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
                  style={{ backgroundColor: note?.tapeColor }}
                  disabled={isLocked}
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
          className="bg-white rounded-sm shadow-2xl p-8 relative font-serif min-h-150"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)",
          }}
        >
          <div
            className="absolute top-0 left-16 w-24 h-12 opacity-70 -translate-y-3"
            style={{ backgroundColor: note?.tapeColor }}
          />
          <div
            className="absolute top-0 left-0 w-3 h-full opacity-30"
            style={{ backgroundColor: note?.tapeColor }}
          />

          {isLocked ? (
            <div className="flex flex-col items-center justify-center h-full pt-20 text-muted-foreground">
              <LockIcon size={48} className="mb-4" />
              <p className="text-xl font-sans">This note is encrypted.</p>
              <Button
                onClick={() => setShowPasswordDialog(true)}
                variant="link"
                className="mt-2 text-primary"
              >
                Unlock with Master Password
              </Button>
            </div>
          ) : isPreview ? (
            <MarkdownPreview markdown={note?.content ?? ""} size="md" />
          ) : (
            <Textarea
              value={note?.content ?? ""}
              onChange={handleContentChange}
              className="w-full h-full bg-transparent border-none outline-none focus-visible:ring-0 focus-visible:border-none focus:ring-0 shadow-none resize-none text-foreground font-mono"
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

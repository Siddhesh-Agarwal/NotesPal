import type { Note } from "@/types/note";
import { BACKEND_BASE_URL } from "@/utils/const";

export async function getNoteFn(
  noteId: string,
  userId: string,
): Promise<Note | undefined> {
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}/${noteId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch note: ${response.status}`);
  }
  return response.json();
}

export async function updateNoteFn(
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

export async function getNotesFn({
  userId,
}: {
  userId?: string;
}): Promise<Note[]> {
  if (!userId) throw new Error("User ID is required");
  const response = await fetch(`${BACKEND_BASE_URL}/notes/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  return response.json();
}

export async function deleteNoteFn({
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

export async function createNoteFn({
  userId,
}: {
  userId?: string;
}): Promise<Note> {
  if (!userId) throw new Error("User ID is required");
  const response = await fetch(`${BACKEND_BASE_URL}/note/${userId}`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to create note");
  }
  return response.json();
}

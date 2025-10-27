import { Trash2Icon } from "lucide-react";
import moment from "moment";
import type { Note } from "@/types/note";
import MarkdownPreview from "./markdown-preview";
import { Button } from "./ui/button";

export const TAPE_COLORS = [
  { name: "Blue", value: "#60a5fa" },
  { name: "Pink", value: "#f472b6" },
  { name: "Yellow", value: "#fbbf24" },
  { name: "Green", value: "#4ade80" },
  { name: "Purple", value: "#a78bfa" },
  { name: "Orange", value: "#fb923c" },
  { name: "Red", value: "#f87171" },
  { name: "Teal", value: "#2dd4bf" },
];

export function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-sm shadow-lg p-6 pb-12 aspect-square cursor-pointer transform hover:rotate-0 transition-all duration-200 hover:shadow-xl font-serif border border-gray-200 block bg-white"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)",
        rotate: `${Math.random() * 2 - 1}deg`,
      }}
    >
      <div
        className="absolute top-0 left-8 w-16 h-8 opacity-70 -translate-y-2"
        style={{ backgroundColor: note.tapeColor }}
      />
      <div
        className="absolute top-0 left-0 w-2 h-full opacity-30"
        style={{ backgroundColor: note.tapeColor }}
      />
      <div className="max-h-[calc(100% - 60px)]">
        <MarkdownPreview
          markdown={note.content}
          size="sm"
          className="text-ellipsis overflow-hidden"
        />
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <p className="text-xs text-gray-400">
          {moment(note.updatedAt).fromNow()}
        </p>
        <Button
          onClick={() => onDelete()}
          variant={"ghost"}
          size={"icon-lg"}
          className="text-destructive hover:bg-destructive/90"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

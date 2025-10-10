import { Trash2Icon } from "lucide-react";
import moment from "moment";
import type { Note } from "@/types/note";
import MarkdownPreview from "./markdown-preview";
import { Button } from "./ui/button";

export function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-sm shadow-lg p-6 pb-12 cursor-pointer transform hover:rotate-0 transition-all duration-200 hover:shadow-xl font-serif"
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

      <MarkdownPreview markdown={note.content} size="sm" />

      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
        <p className="text-xs text-gray-400">
          {moment(note.updatedAt).fromNow()}
        </p>
        <Button
          onClick={() => onDelete()}
          variant={"ghost"}
          size={"icon"}
          className="text-destructive hover:bg-destructive/90"
        >
          <Trash2Icon size={16} />
        </Button>
      </div>
    </div>
  );
}

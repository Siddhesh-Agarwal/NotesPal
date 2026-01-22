import { Trash2Icon } from "lucide-react";
import moment from "moment";
import type { Note } from "@/types";
import MarkdownPreview from "./markdown-preview";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";

export function NoteCard({
  note,
  onDelete,
}: {
  note: Note;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-sm shadow-lg p-6 pb-12 cursor-pointer transform hover:rotate-0 transition-all duration-200 hover:shadow-xl font-serif border border-gray-200 block bg-white w-full"
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
      <div>
        {note.content.trim().length > 0 ? (
          <MarkdownPreview
            markdown={note.content}
            size="sm"
            className="text-ellipsis overflow-hidden"
          />
        ) : (
          <Empty>
            <EmptyHeader>
                <EmptyTitle>No content</EmptyTitle>
                <EmptyDescription>Start writing your note here...</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
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

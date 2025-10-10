import { cn } from "@/lib/utils";
import { parseMarkdown } from "@/utils/md";

export default function MarkdownPreview({
  markdown,
  className,
  size,
}: {
  markdown: string;
  size: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-neutral max-w-none text-gray-800 font-serif",
        size !== "md" && "prose-sm",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(markdown) }}
    />
  );
}

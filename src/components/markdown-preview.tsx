import { marked } from "marked";
import { cn } from "@/lib/utils";

export function parseMarkdown(markdown?: string): string {
  return marked.parse(markdown ?? "") as string;
}

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

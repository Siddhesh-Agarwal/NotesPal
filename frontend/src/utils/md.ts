import { marked } from "marked";

export function parseMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

import type { Meta } from "@/types";

export const metadata: Meta = {
  title: "NotesPal",
  description: "A cutesy no-nonsense note-taking app",
  keywords: ["notes", "note-taking", "app", "notespal"],
  author: "Siddhesh Agarwal",
  site: import.meta.env.DEV
    ? "http://localhost:5173"
    : "https://notespal.siddhesh-agarwal.workers.dev",
};

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

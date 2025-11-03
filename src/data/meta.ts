type Meta = {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  site: string;
};

export const metadata: Meta = {
  title: "NotesPal",
  description: "A cutesy no-nonsense note-taking app",
  keywords: ["notes", "note-taking", "app", "notespal"],
  author: "Siddhesh Agarwal",
  site: import.meta.env.DEV
    ? "http://localhost:5173"
    : "https://notespal.siddhesh-agarwal.workers.dev",
};

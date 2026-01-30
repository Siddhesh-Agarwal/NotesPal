import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileLock2,
  FolderSync,
  type LucideIcon,
  Notebook,
  Zap,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/explore")({
  component: RouteComponent,
});

type BenefitsType = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const benefits: BenefitsType[] = [
  {
    icon: Notebook,
    title: "Manage Notes",
    description: "Create, edit, and delete notes with ease.",
  },
  {
    icon: Zap,
    title: "Fast",
    description: "The app is lightning fast and responsive.",
  },
  {
    icon: FileLock2,
    title: "Encryption",
    description:
      "Your notes are encrypted and secure. Each note is encrypted using a unique key.",
  },
  {
    icon: FolderSync,
    title: "Sync Notes",
    description:
      "Sync your notes across devices. Keep your notes in sync across all your devices.",
  },
];

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold text-center">Features</h1>
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex flex-col gap-4 @container">
          <Link to="/notes" className="flex items-center gap-2 text-foreground">
            <ArrowLeft />
            Back
          </Link>
          <div className="grid grid-cols-1 @md:grid-cols-2 items-center gap-4">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="h-48 shadow hover:shadow-lg">
                <CardHeader>
                  <benefit.icon size={56} className="text-primary rounded-xl" />
                  <CardTitle className="text-2xl font-bold">
                    {benefit.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-ellipsis">
                    {benefit.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

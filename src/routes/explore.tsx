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
    description: "Create, edit, and delete notes with ease",
  },
  {
    icon: FileLock2,
    title: "Encryption",
    description: "Your notes are encrypted and secure",
  },
  {
    icon: Zap,
    title: "Fast",
    description: "The app is lightning fast",
  },
  {
    icon: FolderSync,
    title: "Sync Notes",
    description: "Sync your notes across devices",
  },
];

function RouteComponent() {
  return (
    <div className="min-h-screen bg-background flex flex-col gap-6 p-6">
      <h1 className="text-4xl font-bold text-center">Explore NotesPal</h1>
      <div>
        <Link to="/notes" className="flex items-center gap-2 text-foreground">
          <ArrowLeft />
          Back
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-center gap-6">
        {benefits.map((benefit) => (
          <Card key={benefit.title} className="h-48 shadow hover:shadow-lg">
            <CardHeader>
              <benefit.icon size={56} className="text-primary rounded-xl" />
              <CardTitle className="text-2xl font-bold">
                {benefit.title}
              </CardTitle>
              <CardDescription>{benefit.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

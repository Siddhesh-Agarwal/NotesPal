import { Button } from "@/components/ui/button";
import { metadata } from "@/data/meta";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import {
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  Cloud,
  Heart,
  Pencil,
  Smile,
  Star,
  StickyNote,
  Sun,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="text-center mb-8 font-serif">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold text-foreground flex items-center justify-center gap-2"
        >
          {metadata.title}
        </motion.h1>
        <p className="mt-3 text-lg text-foreground/80">
          Capture ideas, doodle thoughts, and keep your notes playful.
        </p>
      </div>

      {/* Main Illustration */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative w-80 h-80 bg-white border-4 border-dashed border-black rounded-2xl shadow-lg flex items-center justify-center"
      >
        <Image
          src="https://illustrations.popsy.co/white/studying.svg"
          alt="Studying Illustration"
          width={200}
          height={200}
        />
        <div className="absolute top-3 left-3 rotate-[-5deg]">
          <StickyNote className="w-10 h-10 text-chart-1" />
        </div>
        <div className="absolute bottom-4 right-4 rotate-10">
          <Pencil className="w-10 h-10 text-chart-2" />
        </div>
        <p className="text-2xl font-semibold font-serif text-card-foreground">
          Your ideas belong here
        </p>
      </motion.div>

      {/* Buttons */}
      <div className="mt-10">
        <SignedOut>
          <Link to="/auth/sign-up">
            <Button variant={"secondary"} className="gap-2" size={"lg"}>
              <Pencil />
              Start Writing
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link to="/notes">
            <Button variant={"default"} className="gap-2" size={"lg"}>
              <StickyNote />
              View Notes
            </Button>
          </Link>
        </SignedIn>
      </div>

      {/* Random Doodle Arrows */}
      <ArrowBigRight className="absolute top-10 right-20 text-chart-3 rotate-20 opacity-70 w-10 h-10" />
      <ArrowBigLeft className="absolute bottom-16 left-24 text-chart-4 rotate-[-15deg] opacity-70 w-10 h-10" />
      <ArrowBigUp className="absolute top-24 left-12 text-chart-5 rotate-10 opacity-60 w-9 h-9 fill-chart-5" />
      <ArrowBigDown className="absolute bottom-10 right-10 text-chart-1 rotate-[5deg] opacity-60 w-9 h-9" />
      <Heart className="absolute top-16 left-1/2 text-chart-2 rotate-15 opacity-60 w-8 h-8 fill-chart-2" />
      <Star className="hidden sm:block absolute top-1/3 right-12 text-chart-3 -rotate-12 opacity-70 w-9 h-9 fill-chart-3" />
      <Sun className="absolute top-6 left-12 text-chart-4 opacity-60 w-10 h-10" />
      <Cloud className="absolute bottom-20 right-1/3 text-chart-5 opacity-50 w-10 h-10 fill-chart-5" />
      <Zap className="absolute bottom-28 left-10 text-chart-1 rotate-25 opacity-60 w-9 h-9 fill-chart-1" />
      <Smile className="absolute top-1/2 right-8 text-chart-2 rotate-[8deg] opacity-70 w-8 h-8" />
    </div>
  );
}

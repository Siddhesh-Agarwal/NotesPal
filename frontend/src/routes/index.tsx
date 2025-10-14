import { SignUpButton, useAuth } from "@clerk/clerk-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import * as motion from "framer-motion/client";
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
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { userId } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="text-center mb-8 font-serif">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold text-[#2d2a26] flex items-center justify-center gap-2"
        >
          NotePal
        </motion.h1>
        <p className="mt-3 text-lg text-[#6b5e3e]">
          Capture ideas, doodle thoughts, and keep your notes playful.
        </p>
      </div>

      {/* Main Illustration */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative w-80 h-80 bg-white border-4 border-dashed border-[#2d2a26] rounded-2xl shadow-lg flex items-center justify-center"
      >
        <div className="absolute top-3 left-3 rotate-[-5deg]">
          <StickyNote className="w-10 h-10 text-chart-1" />
        </div>
        <div className="absolute bottom-4 right-4 rotate-[10deg]">
          <Pencil className="w-10 h-10 text-chart-2" />
        </div>
        <p className="text-2xl text-[#2d2a26] font-semibold font-serif">
          Your ideas belong here
        </p>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 flex gap-4"
      >
        {userId ? (
          <SignUpButton forceRedirectUrl={"/notes"}>
            <Button className="bg-[#2d2a26] text-[#fff8e7] hover:bg-[#4a433c] px-6 py-2 rounded-xl">
              <Pencil className="mr-2" />
              Start Writing
            </Button>
          </SignUpButton>
        ) : (
          <Link to="/notes">
            <Button className="rounded-xl">
              <StickyNote className="mr-2" />
              View Notes
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Random Doodle Arrows */}
      <ArrowBigRight className="absolute top-10 right-20 text-chart-3 rotate-[20deg] opacity-70 w-10 h-10" />
      <ArrowBigLeft className="absolute bottom-16 left-24 text-chart-4 rotate-[-15deg] opacity-70 w-10 h-10" />
      <ArrowBigUp className="absolute top-24 left-12 text-chart-5 rotate-[10deg] opacity-60 w-9 h-9" />
      <ArrowBigDown className="absolute bottom-10 right-10 text-chart-1 rotate-[5deg] opacity-60 w-9 h-9" />
      <Heart className="absolute top-16 left-1/2 text-chart-2 rotate-[15deg] opacity-60 w-8 h-8" />
      <Star className="absolute top-1/3 right-12 text-chart-3 rotate-[-10deg] opacity-70 w-9 h-9" />
      <Sun className="absolute top-6 left-12 text-chart-4 opacity-60 w-10 h-10" />
      <Cloud className="absolute bottom-20 right-1/3 text-chart-5 opacity-50 w-10 h-10" />
      <Zap className="absolute bottom-28 left-10 text-chart-1 rotate-[25deg] opacity-60 w-9 h-9" />
      <Smile className="absolute top-1/2 right-8 text-chart-2 rotate-[8deg] opacity-70 w-8 h-8" />

      {/* Footer Doodles */}
      <div className="absolute bottom-5 flex gap-6 opacity-70">
        <StickyNote className="text-chart-3" />
        <Pencil className="text-chart-4" />
      </div>
    </div>
  );
}

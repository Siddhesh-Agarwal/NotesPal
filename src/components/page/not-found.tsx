import { Link } from "@tanstack/react-router";
import { ArrowLeft, Ghost, Notebook } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage({ backTo }: { backTo: string }) {
  return (
    <div className="h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <Card className="flex flex-col items-center text-center gap-5 p-8 relative overflow-hidden">
          {/* Decorative floating icon */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
          >
            <Ghost className="h-14 w-14 text-muted-foreground opacity-60" />
          </motion.div>

          <CardContent className="p-0">
            <h1 className="text-3xl font-semibold mb-2">
              Oops... Lost your notes?
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This page fluttered away like an absent-minded thought. Maybe it’s
              hiding in another notebook?
            </p>

            <div className="mt-6 flex justify-center">
              <Link to={backTo}>
                <Button className="inline-flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
              </Link>
            </div>
          </CardContent>

          {/* Floating doodle icons */}
          <div className="absolute -top-6 left-10 text-chart-1 rotate-12 opacity-30">
            <Notebook className="h-6 w-6" />
          </div>
          <div className="absolute bottom-8 right-10 text-chart-2 -rotate-12 opacity-40">
            <Notebook className="h-5 w-5" />
          </div>
        </Card>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>404 • Nothing to see here but good vibes and empty pages</p>
        </div>
      </motion.div>
    </div>
  );
}

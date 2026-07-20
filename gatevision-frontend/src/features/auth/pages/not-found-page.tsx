import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex max-w-sm flex-col items-center text-center"
      >
        <motion.div
          variants={staggerItem}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-elevated"
        >
          <SearchX className="h-8 w-8 text-muted-foreground" />
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="text-4xl font-bold tracking-tight"
        >
          404
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-2 text-sm text-muted-foreground"
        >
          This page could not be found in the Security Operations Center.
        </motion.p>

        <motion.div variants={scaleIn} className="mt-8">
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export { NotFoundPage };

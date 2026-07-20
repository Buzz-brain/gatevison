import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";

function UnauthorizedPage() {
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
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10"
        >
          <ShieldOff className="h-8 w-8 text-danger" />
        </motion.div>

        <motion.h1
          variants={staggerItem}
          className="text-xl font-semibold"
        >
          Access Denied
        </motion.h1>

        <motion.p
          variants={staggerItem}
          className="mt-2 text-sm text-muted-foreground"
        >
          You don't have the required permissions to access this area. Contact your administrator if you need access.
        </motion.p>

        <motion.div variants={scaleIn} className="mt-8 flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export { UnauthorizedPage };

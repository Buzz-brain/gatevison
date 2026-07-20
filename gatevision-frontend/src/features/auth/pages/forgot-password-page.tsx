import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "../components/animated-background";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      <AnimatedBackground />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.03),transparent_70%)]" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-sm"
      >
        {submitted ? (
          <motion.div
            variants={scaleIn}
            className="rounded-2xl border border-border/60 bg-elevated/80 backdrop-blur-xl p-8 text-center shadow-2xl"
          >
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <h2 className="text-lg font-medium">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a password reset link to <strong>{email}</strong>
            </p>
            <Button variant="link" className="mt-4" asChild>
              <Link to="/login">Back to login</Link>
            </Button>
          </motion.div>
        ) : (
          <>
            <motion.div variants={staggerItem} className="mb-8">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="mb-6">
              <h1 className="text-xl font-semibold">Reset password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </motion.div>

            <motion.div variants={scaleIn} className="rounded-2xl border border-border/60 bg-elevated/80 backdrop-blur-xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="reset-email" className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@gatevision.io"
                      required
                      className="w-full rounded-lg border border-border bg-surface pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="xl"
                  disabled={isLoading || !email}
                  className="w-full text-base font-medium"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </span>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export { ForgotPasswordPage };

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  AlertTriangle,
  WifiOff,
  Clock,
  ShieldOff,
  ChevronLeft,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  slideUp,
  fadeIn,
  scaleIn,
} from "@/lib/animations";

function LoginForm() {
  const { login, isLoading, error, remainingAttempts, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ke = e as KeyboardEvent;
      if (typeof ke.getModifierState === "function") {
        setCapsLock(ke.getModifierState("CapsLock"));
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", handler);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    clearError();
    try {
      await login(email, password, rememberMe);
    } catch {
      // error is set in store
    }
  };

  const errorIcon = error ? (
    error.code === "OFFLINE" ? <WifiOff className="h-4 w-4" />
    : error.code === "TOO_MANY_ATTEMPTS" || error.code === "RATE_LIMITED" ? <Clock className="h-4 w-4" />
    : error.code === "ACCOUNT_LOCKED" || error.code === "FORBIDDEN" ? <ShieldOff className="h-4 w-4" />
    : <AlertCircle className="h-4 w-4" />
  ) : null;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.form
          key="login-form"
          ref={formRef}
          variants={slideUp}
          initial="hidden"
          animate="visible"
          exit="exit"
          onSubmit={handleSubmit}
          className="space-y-5"
          noValidate
        >
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3.5 text-sm",
                  error.code === "OFFLINE" && "border-warning/20 bg-warning/5",
                  (error.code === "ACCOUNT_LOCKED" || error.code === "FORBIDDEN") && "border-danger/20 bg-danger/5",
                  (error.code === "TOO_MANY_ATTEMPTS" || error.code === "RATE_LIMITED") && "border-warning/20 bg-warning/5",
                  (error.code === "INVALID_CREDENTIALS" || error.code === "SESSION_EXPIRED" || error.code === "UNAUTHORIZED") && "border-danger/20 bg-danger/5",
                  (error.code === "NETWORK_ERROR" || error.code === "SERVER_ERROR") && "border-warning/20 bg-warning/5",
                )}
                role="alert"
              >
                <span className="mt-0.5 shrink-0">{errorIcon}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{error.message}</p>
                  {remainingAttempts > 0 && error.code === "INVALID_CREDENTIALS" && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""} remaining
                    </p>
                  )}
                  {error.retryAfter && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Try again in {Math.ceil(error.retryAfter / 60)} minute{Math.ceil(error.retryAfter / 60) !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss error"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="admin@gatevision.io"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                disabled={isLoading}
                required
                className={cn(
                  "w-full rounded-lg border bg-surface pl-10 pr-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all",
                  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  error && "border-danger/50 focus-visible:border-danger focus-visible:ring-danger/20",
                )}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isLoading}
                required
                className={cn(
                  "w-full rounded-lg border bg-surface pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all",
                  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  error && "border-danger/50 focus-visible:border-danger focus-visible:ring-danger/20",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <AnimatePresence>
              {capsLock && (
                <motion.p
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex items-center gap-1.5 text-xs text-warning"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Caps Lock is on
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-border bg-surface text-primary focus:ring-primary/20 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => navigate({ to: "/forgot-password" })}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="xl"
            disabled={isLoading || !email || !password}
            className="w-full text-base font-medium"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}

export { LoginForm };

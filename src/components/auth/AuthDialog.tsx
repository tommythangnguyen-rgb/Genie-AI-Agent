"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "signin" | "signup";
}

type Mode = "signin" | "signup" | "forgot" | "forgot-sent";

export function AuthDialog({
  open,
  onOpenChange,
  defaultMode = "signin",
}: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, open]);

  const handleSuccess = () => onOpenChange(false);

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setMode("forgot-sent");
    } catch {
      setForgotError("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create an account",
    forgot: "Reset your password",
    "forgot-sent": "Check your email",
  };

  const descriptions: Record<Mode, string> = {
    signin: "Sign in to your account to continue",
    signup: "Create a free account to get more questions and save your history",
    forgot: "Enter your email and we'll send you a reset link",
    "forgot-sent": `We sent a reset link to ${forgotEmail}. Check your inbox — it expires in 1 hour.`,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>
          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {mode === "signin" && (
            <SignInForm
              onSuccess={handleSuccess}
              onForgotPassword={() => { setForgotEmail(""); setForgotError(""); setMode("forgot"); }}
            />
          )}
          {mode === "signup" && <SignUpForm onSuccess={handleSuccess} />}
          {mode === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={forgotLoading}
                />
              </div>
              {forgotError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {forgotError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={forgotLoading}>
                {forgotLoading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
          {mode === "forgot-sent" && (
            <div className="text-center py-2">
              <div className="text-4xl mb-3">📬</div>
              <Button className="w-full mt-2" onClick={() => setMode("signin")}>
                Back to sign in
              </Button>
            </div>
          )}
        </div>

        {(mode === "signin" || mode === "signup") && (
          <div className="mt-4 text-center text-sm">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <Button variant="link" className="p-0 h-auto font-normal" onClick={() => setMode("signup")}>
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button variant="link" className="p-0 h-auto font-normal" onClick={() => setMode("signin")}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        )}
        {mode === "forgot" && (
          <div className="mt-4 text-center text-sm">
            <Button variant="link" className="p-0 h-auto font-normal" onClick={() => setMode("signin")}>
              Back to sign in
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

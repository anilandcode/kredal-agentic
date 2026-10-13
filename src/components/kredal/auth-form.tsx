"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthActionState } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (
    state: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>;
  next?: string;
}

const initialState: AuthActionState = {};

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  // Controlled so a failed submit doesn't wipe the field (React 19 resets
  // uncontrolled inputs when the form action settles).
  const [email, setEmail] = useState("");
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {isSignup ? (
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Anil Pervaiz"
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.ae"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          {!isSignup ? (
            <Link
              href="/forgot-password"
              className="text-caption font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-md border border-risk-high/30 bg-risk-high-bg px-3 py-2 text-sm text-risk-high-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="flex items-start gap-2 rounded-md border border-risk-low/30 bg-risk-low-bg px-3 py-2 text-sm text-risk-low-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.message}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSignup ? (
          "Create account"
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}

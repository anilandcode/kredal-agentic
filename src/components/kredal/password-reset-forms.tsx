"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordReset,
  updatePassword,
  type AuthActionState,
} from "@/app/actions/auth";

const initialState: AuthActionState = {};

function StateMessages({ state }: { state: AuthActionState }) {
  return (
    <>
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
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Account email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.ae"
        />
      </div>
      <StateMessages state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <StateMessages state={state} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set new password"}
      </Button>
    </form>
  );
}

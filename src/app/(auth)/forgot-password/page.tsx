import Link from "next/link";
import { ForgotPasswordForm } from "@/components/kredal/password-reset-forms";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-h1 font-semibold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

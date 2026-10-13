import Link from "next/link";
import { AuthForm } from "@/components/kredal/auth-form";
import { signUp } from "@/app/actions/auth";

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-h1 font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start a bank-readiness assessment for your UAE company.
        </p>
      </div>
      <AuthForm mode="signup" action={signUp} />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

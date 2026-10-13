import Link from "next/link";
import { AuthForm } from "@/components/kredal/auth-form";
import { signIn } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-h1 font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Continue to your Kredal workspace.
        </p>
      </div>
      <AuthForm mode="login" action={signIn} next={next} />
      <p className="text-center text-sm text-muted-foreground">
        New to Kredal?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "@/components/kredal/password-reset-forms";

export default async function ResetPasswordPage() {
  // The reset link's /auth/callback exchange must have produced a session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/forgot-password");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-h1 font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Setting a new password for {user.email}.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

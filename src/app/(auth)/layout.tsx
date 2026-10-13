import Link from "next/link";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { SecurityStrip } from "@/components/kredal/security-strip";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <Link href="/">
        <KredalLogo className="text-lg" />
      </Link>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
      <SecurityStrip />
    </div>
  );
}

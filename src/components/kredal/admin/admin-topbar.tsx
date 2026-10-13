"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { KredalLogo } from "@/components/kredal/kredal-logo";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/kredal/user-menu";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/workspaces", label: "Workspaces" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/ai", label: "AI & docs" },
];

export function AdminTopbar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-border">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <KredalLogo />
          </Link>
          <Badge variant="outline" className="border-brand/40 text-brand">
            Admin
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to app
          </Link>
          <UserMenu email={email} />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-6">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-body-sm whitespace-nowrap transition-colors",
                active
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

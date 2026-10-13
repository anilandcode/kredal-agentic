import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateWorkspaceForm } from "@/components/kredal/create-workspace-form";

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Dashboard
      </Link>
      <div className="space-y-1.5">
        <h1 className="text-h1 font-semibold">New workspace</h1>
        <p className="text-body-sm text-muted-foreground">
          A second workspace keeps another business — or a consultant client
          book — fully separate.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}

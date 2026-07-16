import { FileCheck, Lock, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

const CONTROLS = [
  {
    icon: Lock,
    title: "Private storage, always",
    body: "Every document lives in a private storage bucket. There is no public URL for any file — access is only ever granted through short-lived signed URLs generated server-side for an authenticated, authorized workspace member.",
  },
  {
    icon: ShieldCheck,
    title: "Row-level security on every table",
    body: "Every table in our database enforces row-level security scoped to your workspace. A workspace member can only ever see the companies, documents, and reports that belong to their own workspace — never another client's data.",
  },
  {
    icon: UserCheck,
    title: "Role-based access within a workspace",
    body: "Consultant workspaces support owner, admin, member, and read-only viewer roles. Viewers can see a client's file but cannot upload, edit, or delete anything.",
  },
  {
    icon: FileCheck,
    title: "Every action is logged",
    body: "Company creation, document uploads and deletions, questionnaire changes, assessments, and report generation are all recorded in an append-only audit log.",
  },
  {
    icon: Trash2,
    title: "You control deletion",
    body: "You can delete any uploaded document at any time. We do not train AI models on your documents.",
  },
];

export default function SecurityPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteNav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
        <p className="eyebrow">Security</p>
        <h1 className="mt-3 text-display font-medium">
          Security &amp; data handling
        </h1>
        <p className="mt-4 text-body text-muted-foreground">
          Kredal handles sensitive documents — trade licenses, passports,
          Emirates IDs, UBO declarations. Here is exactly how we protect them.
        </p>

        <div className="mt-12 space-y-8">
          {CONTROLS.map((c) => (
            <div key={c.title} className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-card-02 text-foreground">
                <c.icon className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-h3 font-semibold">{c.title}</h2>
                <p className="mt-1 text-body-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

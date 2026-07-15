"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inviteMember,
  changeMemberRole,
  removeMember,
  type MemberActionState,
} from "@/app/actions/members";
import type { WorkspaceMemberInfo } from "@/lib/data/members";
import type { WorkspaceMemberRole } from "@/lib/types";

const initialState: MemberActionState = {};

const ROLE_OPTIONS: { value: WorkspaceMemberRole; label: string; hint: string }[] = [
  { value: "admin", label: "Admin", hint: "Manage members, edit everything" },
  { value: "member", label: "Member", hint: "Create and edit companies" },
  { value: "viewer", label: "Viewer", hint: "Read-only access" },
];

function StateMessages({ state }: { state: MemberActionState }) {
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

function MemberRoleForm({
  workspaceId,
  member,
}: {
  workspaceId: string;
  member: WorkspaceMemberInfo;
}) {
  const [state, formAction, pending] = useActionState(
    changeMemberRole.bind(null, workspaceId, member.id),
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Select name="role" defaultValue={member.role} disabled={pending}>
        <SelectTrigger className="h-8 w-28" aria-label={`Role for ${member.email}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" variant="ghost" disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
      </Button>
      {state.error ? (
        <span className="text-caption text-risk-high">{state.error}</span>
      ) : null}
    </form>
  );
}

export function MembersManager({
  workspaceId,
  members,
  canManage,
}: {
  workspaceId: string;
  members: WorkspaceMemberInfo[];
  canManage: boolean;
}) {
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteMember.bind(null, workspaceId),
    initialState
  );

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-body-sm font-medium">
                {member.fullName ?? member.email ?? member.userId}
                {member.isSelf ? (
                  <span className="ml-1.5 text-caption text-muted-foreground">(you)</span>
                ) : null}
              </p>
              {member.email ? (
                <p className="truncate text-caption text-muted-foreground">{member.email}</p>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {member.role === "owner" ? (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-caption font-medium text-accent-foreground">
                  Owner
                </span>
              ) : canManage ? (
                <>
                  <MemberRoleForm workspaceId={workspaceId} member={member} />
                  <form
                    action={() => removeMember(workspaceId, member.id)}
                    onSubmit={(e) => {
                      if (!confirm(`Remove ${member.email ?? "this member"}?`)) e.preventDefault();
                    }}
                  >
                    <Button
                      type="submit"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Remove ${member.email ?? "member"}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    </Button>
                  </form>
                </>
              ) : (
                <span className="text-caption capitalize text-muted-foreground">{member.role}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage ? (
        <form
          action={inviteAction}
          className="grid gap-3 rounded-lg border border-dashed border-border p-4 sm:grid-cols-[1fr_auto_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite_email">Invite by email</Label>
            <Input
              id="invite_email"
              name="email"
              type="email"
              required
              placeholder="colleague@firm.ae"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite_role">Role</Label>
            <Select name="role" defaultValue="member">
              <SelectTrigger id="invite_role" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label} — {r.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={invitePending}>
              {invitePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" strokeWidth={1.5} />
                  Invite
                </>
              )}
            </Button>
          </div>
          <div className="sm:col-span-3">
            <StateMessages state={inviteState} />
          </div>
        </form>
      ) : null}
    </div>
  );
}

"use client";

import { Building2, Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveWorkspace } from "@/app/actions/workspace";

export interface SwitcherWorkspace {
  id: string;
  name: string;
  workspace_type: string;
}

export function WorkspaceSwitcher({
  workspaces,
  activeId,
}: {
  workspaces: SwitcherWorkspace[];
  activeId: string;
}) {
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];
  if (!active) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md px-2 py-1 text-body-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <Building2 className="h-4 w-4" strokeWidth={1.5} />
        <span className="max-w-40 truncate">{active.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-caption text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} asChild>
            <button
              type="button"
              className="w-full cursor-pointer"
              onClick={() => setActiveWorkspace(ws.id)}
            >
              <span className="flex-1 truncate text-start">{ws.name}</span>
              {ws.id === active.id ? (
                <Check className="h-4 w-4 text-primary" strokeWidth={2} />
              ) : null}
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/workspace/settings" className="cursor-pointer">
            <Settings className="h-4 w-4" strokeWidth={1.5} />
            Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/workspace/new" className="cursor-pointer">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            New workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CompanyDocument } from "@/lib/types";

export async function getCompanyDocuments(
  companyId: string
): Promise<CompanyDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runExtraction } from "@/lib/ai/extract-document";

/**
 * Manual "Extract" / "Re-extract" for a document. RLS on the select proves the
 * signed-in user may access this document before the privileged extraction runs.
 */
export async function extractDocument(companyId: string, documentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: doc } = await supabase
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return; // not visible to this user

  await runExtraction(documentId);

  revalidatePath(`/app/companies/${companyId}/documents`);
  revalidatePath(`/app/companies/${companyId}`);
}

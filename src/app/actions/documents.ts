"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { runExtraction } from "@/lib/ai/extract-document";
import { isExtractable } from "@/lib/ai/extraction";
import type { DocumentType } from "@/lib/types";

export interface DocumentActionState {
  error?: string;
}

const BUCKET = "company-documents";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
const SIGNED_URL_TTL_SECONDS = 120;

async function getCompanyWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
) {
  const { data, error } = await supabase
    .from("companies")
    .select("workspace_id")
    .eq("id", companyId)
    .single();
  if (error || !data) return null;
  return data.workspace_id as string;
}

export async function uploadDocument(
  companyId: string,
  documentType: DocumentType,
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "File is larger than 15MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const workspaceId = await getCompanyWorkspaceId(supabase, companyId);
  if (!workspaceId) return { error: "Company not found." };

  const documentId = randomUUID();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${workspaceId}/${companyId}/${documentId}/${safeFilename}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const expiryRaw = String(formData.get("expiry_date") ?? "").trim();
  const expiryDate = /^\d{4}-\d{2}-\d{2}$/.test(expiryRaw) ? expiryRaw : null;

  const { error: insertError } = await supabase.from("documents").insert({
    id: documentId,
    company_id: companyId,
    uploaded_by: user.id,
    document_type: documentType,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type || null,
    file_size_bytes: file.size,
    expiry_date: expiryDate,
    status: "uploaded",
  });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { error: insertError.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    companyId,
    eventType: "document_uploaded",
    eventData: { document_type: documentType, filename: file.name },
  });

  // AI extraction runs after the response is sent (no upload latency added).
  // Membership was proven by the RLS-gated insert above.
  if (isExtractable(documentType)) {
    after(() => runExtraction(documentId));
  }

  revalidatePath(`/app/companies/${companyId}/documents`);
  revalidatePath(`/app/companies/${companyId}`);
  return {};
}

export async function deleteDocument(
  companyId: string,
  documentId: string,
  storagePath: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getCompanyWorkspaceId(supabase, companyId);

  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase.from("documents").delete().eq("id", documentId);

  await logAuditEvent(supabase, {
    userId: user.id,
    workspaceId,
    companyId,
    eventType: "document_deleted",
    eventData: { document_id: documentId },
  });

  revalidatePath(`/app/companies/${companyId}/documents`);
  revalidatePath(`/app/companies/${companyId}`);
}

/** TECH_SPEC.md §10 — createSignedDocumentUrl. Redirects the browser straight
 * to a short-lived signed URL; never exposes the private bucket publicly. */
export async function createSignedDocumentUrl(storagePath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error(error?.message ?? "Could not open document.");
  }

  redirect(data.signedUrl);
}

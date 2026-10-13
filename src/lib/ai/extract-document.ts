import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiConfigured } from "@/lib/ai/gemini";
import { extractFromFile, isExtractable } from "@/lib/ai/extraction";
import type { DocumentType } from "@/lib/types";

const BUCKET = "company-documents";
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Runs AI extraction for one document and stores the result on its row.
 *
 * Uses the service-role client because it also runs *after* the request
 * (via `next/server` `after()`), where the user's cookie context is gone.
 * Callers MUST have already verified the user may access this document
 * (the upload action creates it under RLS; the manual action re-reads it
 * with the user-scoped client first).
 */
export async function runExtraction(documentId: string): Promise<void> {
  if (!geminiConfigured()) return; // AI layer not enabled — silently skip.

  const admin = createAdminClient();

  const { data: doc } = await admin
    .from("documents")
    .select("id, company_id, uploaded_by, document_type, storage_path, mime_type")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc || !isExtractable(doc.document_type as DocumentType)) return;

  try {
    const { data: file, error: downloadError } = await admin.storage
      .from(BUCKET)
      .download(doc.storage_path);
    if (downloadError || !file) throw new Error(downloadError?.message ?? "download failed");

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const mime = doc.mime_type ?? "application/pdf";

    const { data, confidence } = await extractFromFile(
      doc.document_type as DocumentType,
      mime,
      base64
    );

    await admin
      .from("documents")
      .update({
        extracted_text: JSON.stringify(data),
        parse_confidence: confidence,
        status: confidence >= CONFIDENCE_THRESHOLD ? "parsed" : "needs_review",
      })
      .eq("id", documentId);

    await admin.from("audit_events").insert({
      company_id: doc.company_id,
      user_id: doc.uploaded_by,
      event_type: "document_extracted",
      event_data: { document_id: documentId, confidence },
    });
  } catch (err) {
    // Extraction failure is non-fatal: flag for human review, keep the file.
    await admin
      .from("documents")
      .update({ status: "needs_review", parse_confidence: 0 })
      .eq("id", documentId);
    await admin.from("audit_events").insert({
      company_id: doc.company_id,
      user_id: doc.uploaded_by,
      event_type: "document_extraction_failed",
      event_data: { document_id: documentId, error: String(err).slice(0, 300) },
    });
    console.error(`extraction failed for ${documentId}:`, err);
  }
}

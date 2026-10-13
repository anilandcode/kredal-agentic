"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { getSectionQuestions } from "@/lib/questionnaire/schema";
import type { QuestionnaireSectionKey } from "@/lib/constants";

export interface QuestionnaireActionState {
  error?: string;
  savedAt?: number;
}

export async function saveQuestionnaireSection(
  companyId: string,
  section: QuestionnaireSectionKey,
  _prevState: QuestionnaireActionState,
  formData: FormData
): Promise<QuestionnaireActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const questions = getSectionQuestions(section);
  const rows = questions
    .filter((q) => formData.has(q.key))
    .map((q) => {
      const raw = String(formData.get(q.key) ?? "").trim();
      const answer_json = q.type === "number" ? (raw ? Number(raw) : null) : raw;
      return {
        company_id: companyId,
        section,
        question_key: q.key,
        answer_json,
      };
    });

  if (rows.length === 0) {
    return { error: "Nothing to save." };
  }

  const { error } = await supabase
    .from("questionnaire_responses")
    .upsert(rows, { onConflict: "company_id,question_key" });

  if (error) return { error: error.message };

  await logAuditEvent(supabase, {
    userId: user.id,
    companyId,
    eventType: "questionnaire_section_saved",
    eventData: { section },
  });

  revalidatePath(`/app/companies/${companyId}/questionnaire`);
  revalidatePath(`/app/companies/${companyId}`);
  return { savedAt: Date.now() };
}

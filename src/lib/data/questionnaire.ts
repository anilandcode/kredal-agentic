import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Flattened { question_key: value } map for a company, across all sections. */
export async function getQuestionnaireAnswers(
  companyId: string
): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("question_key, answer_json")
    .eq("company_id", companyId);

  if (error) throw error;

  const answers: Record<string, unknown> = {};
  for (const row of data ?? []) {
    answers[row.question_key] = row.answer_json;
  }
  return answers;
}

/** Which of the 8 sections have at least one saved answer. */
export async function getCompletedSections(companyId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questionnaire_responses")
    .select("section")
    .eq("company_id", companyId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.section));
}

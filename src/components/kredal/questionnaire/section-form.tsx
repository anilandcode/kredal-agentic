"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionField } from "@/components/kredal/questionnaire/question-field";
import type { QuestionnaireActionState } from "@/app/actions/questionnaire";
import type { QuestionDef } from "@/lib/questionnaire/schema";

const initialState: QuestionnaireActionState = {};

export function SectionForm({
  questions,
  answers,
  action,
  onSaved,
}: {
  questions: QuestionDef[];
  answers: Record<string, unknown>;
  action: (
    state: QuestionnaireActionState,
    formData: FormData
  ) => Promise<QuestionnaireActionState>;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const radioKeys = questions.filter((q) => q.type === "radio").map((q) => q.key);
  const [radioValues, setRadioValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const key of radioKeys) {
      const v = answers[key];
      if (typeof v === "string") init[key] = v;
    }
    return init;
  });

  useEffect(() => {
    if (state.savedAt) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  function isVisible(q: QuestionDef) {
    if (!q.showIf) return true;
    return radioValues[q.showIf.key] === q.showIf.equals;
  }

  return (
    <form action={formAction} className="space-y-5">
      {questions.filter(isVisible).map((question) => (
        <QuestionField
          key={question.key}
          question={question}
          defaultValue={
            typeof answers[question.key] === "string" || typeof answers[question.key] === "number"
              ? String(answers[question.key])
              : undefined
          }
          radioValue={question.type === "radio" ? radioValues[question.key] : undefined}
          onRadioChange={
            question.type === "radio"
              ? (value) => setRadioValues((prev) => ({ ...prev, [question.key]: value }))
              : undefined
          }
        />
      ))}

      {state.error ? (
        <p className="flex items-start gap-2 rounded-md border border-risk-high/30 bg-risk-high-bg px-3 py-2 text-sm text-risk-high-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & continue"}
        </Button>
        {state.savedAt ? (
          <span className="flex items-center gap-1 text-body-sm text-risk-low">
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
            Saved
          </span>
        ) : null}
      </div>
    </form>
  );
}

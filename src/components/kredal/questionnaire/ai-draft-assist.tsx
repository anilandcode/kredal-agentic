"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  draftSourceOfFundsNarrative,
  type NarrativeActionState,
} from "@/app/actions/narrative";

const initialState: NarrativeActionState = {};

/**
 * AI draft assistant for the source-of-funds narrative. The draft is editable
 * and only lands in the questionnaire when the founder explicitly clicks
 * "Use draft" — which fills the actual answer field for them to save.
 */
export function AiDraftAssist({
  companyId,
  targetFieldId,
}: {
  companyId: string;
  targetFieldId: string;
}) {
  const [state, formAction, pending] = useActionState(
    draftSourceOfFundsNarrative.bind(null, companyId),
    initialState
  );
  const [editedDraft, setEditedDraft] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const draft = editedDraft ?? state.draft ?? "";

  function applyDraft() {
    const field = document.getElementById(targetFieldId);
    if (field instanceof HTMLTextAreaElement) {
      // The answer field is uncontrolled (FormData on submit), so setting the
      // value directly is sufficient — the founder still has to press Save.
      field.value = draft;
      field.focus();
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  }

  return (
    <div className="mb-5 rounded-lg border border-dashed border-accent-foreground/30 bg-accent/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-body-sm">
          <span className="font-medium">Draft with AI</span>{" "}
          <span className="text-muted-foreground">
            — writes a first version from your answers. Review before use.
          </span>
        </p>
        <form action={formAction}>
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                {state.draft ? "Redraft" : "Draft with AI"}
              </>
            )}
          </Button>
        </form>
      </div>

      {state.error ? (
        <p className="mt-3 flex items-start gap-2 text-body-sm text-risk-high">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
          {state.error}
        </p>
      ) : null}

      {state.draft ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setEditedDraft(e.target.value)}
            rows={5}
            aria-label="AI draft — review before use"
          />
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={applyDraft}>
              {applied ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Inserted — review &amp; save
                </>
              ) : (
                "Use draft"
              )}
            </Button>
            <span className="text-caption text-muted-foreground">
              AI draft — you are responsible for its accuracy.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

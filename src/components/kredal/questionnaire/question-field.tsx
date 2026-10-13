import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionDef } from "@/lib/questionnaire/schema";

export function QuestionField({
  question,
  defaultValue,
  radioValue,
  onRadioChange,
}: {
  question: QuestionDef;
  defaultValue?: string;
  /** Only used for type "radio" — lets the parent track conditional triggers. */
  radioValue?: string;
  onRadioChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={question.key}>{question.label}</Label>
      {question.helpText ? (
        <p className="text-caption text-muted-foreground">{question.helpText}</p>
      ) : null}

      {question.type === "textarea" ? (
        <Textarea
          id={question.key}
          name={question.key}
          required={question.required}
          defaultValue={defaultValue}
          placeholder={question.placeholder}
          rows={3}
        />
      ) : question.type === "number" ? (
        <Input
          id={question.key}
          name={question.key}
          type="number"
          min="0"
          required={question.required}
          defaultValue={defaultValue}
          placeholder={question.placeholder}
        />
      ) : question.type === "select" ? (
        <Select name={question.key} defaultValue={defaultValue}>
          <SelectTrigger id={question.key} className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : question.type === "radio" ? (
        <RadioGroup
          name={question.key}
          value={radioValue}
          onValueChange={onRadioChange}
          className="flex gap-4"
        >
          {question.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-1.5 text-body-sm"
            >
              <RadioGroupItem value={opt.value} id={`${question.key}_${opt.value}`} />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
      ) : (
        <Input
          id={question.key}
          name={question.key}
          required={question.required}
          defaultValue={defaultValue}
          placeholder={question.placeholder}
        />
      )}
    </div>
  );
}

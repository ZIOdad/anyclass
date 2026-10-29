"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

import { submitComplaint, type ReportState } from "./actions";

export function ReportForm() {
  const [state, formAction, pending] = useActionState<ReportState, FormData>(
    submitComplaint,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="body">어떤 문제가 있나요?</FieldLabel>
        <Textarea
          id="body"
          name="body"
          rows={5}
          defaultValue={state.text ?? ""}
          placeholder="예: 욕실 천장에서 물이 새요"
          maxLength={1000}
          disabled={pending}
        />
        <FieldDescription>
          카테고리를 고르지 않아도 됩니다. 쉬운 말로 적어 주세요.
        </FieldDescription>
        {state.error && <FieldError>{state.error}</FieldError>}
      </Field>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "접수하는 중…" : "접수하기"}
      </Button>
    </form>
  );
}

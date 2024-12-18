import { z, ZodSchema } from "zod";
import type { ActionFunction } from "@remix-run/server-runtime";
import { useFetcher } from "@remix-run/react";
import { type FormEvent, useEffect } from "react";
import { type ErrorResponse, type InvalidSubmissionResponse, isErrorResponse } from "../utils/error.js";
import { type DefaultValue, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { Submission } from "@conform-to/dom";

type ActionReturnType<TAction extends ActionFunction> = Awaited<ReturnType<TAction>>;

interface UseActionOptions<TAction extends ActionFunction, TSchema extends ZodSchema> {
  path?: string;

  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  onSuccess?(response: Exclude<ActionReturnType<TAction>, InvalidSubmissionResponse<ReturnType<Submission<z.infer<TSchema>>["reply"]>> | ErrorResponse<null>>): void;

  onError?(response: InvalidSubmissionResponse<ReturnType<Submission<z.infer<TSchema>>["reply"]>> | ErrorResponse<null>): void;
}

function useAction<TAction extends ActionFunction, TSchema extends ZodSchema>(options: UseActionOptions<TAction, TSchema>) {
  const fetcher = useFetcher<TAction>();
  const submit = (data: z.infer<TSchema>) => {
    fetcher.submit(data, {
      method: options.method,
      action: options.path
    });
  };
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (isErrorResponse(fetcher.data)) {
        options.onError?.(fetcher.data);
      } else {
        options.onSuccess?.(fetcher.data);
      }
    }
  }, [fetcher.state, fetcher.data]);

  return { submit, fetcher };
}

interface UseActionFormOptions<TAction extends ActionFunction, TSchema extends ZodSchema>
  extends UseActionOptions<TAction, TSchema> {
  schema: TSchema;
  onFormSubmit?: (event: FormEvent<HTMLFormElement>, data: z.infer<TSchema>) => void;
  defaultValue?: DefaultValue<z.infer<TSchema>>;
}

function useActionForm<TAction extends ActionFunction, TSchema extends ZodSchema>(
  options: UseActionFormOptions<TAction, TSchema> & {
    schema: TSchema;
  }
) {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema: options.schema
      });
    },
    onSubmit(event, { submission }) {
      if (submission?.status !== "success") {
        return;
      }
      options.onFormSubmit?.(event, submission.value);
    },
    defaultValue: options.defaultValue
  });
  const { fetcher, submit } = useAction<TAction, TSchema>(options);
  return { form, fields, fetcher, submit };
}

export { useAction, useActionForm };

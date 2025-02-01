import { z, ZodSchema } from "zod";
import type { ActionFunction } from "@remix-run/server-runtime";
import { type FormEvent, useEffect } from "react";
import { type ErrorResponse, type InvalidSubmissionResponse, isSuccessResponse } from "../utils/error.js";
import { type DefaultValue, useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import type { Submission } from "@conform-to/dom";
import { serializeToFormData } from "../utils/serialize-to-form-data.js";
import { type FetcherWithComponents, useFetcher } from "react-router";

type ActionReturnType<TAction extends ActionFunction> = Awaited<ReturnType<TAction>>;

export type SuccessResponseData<TAction extends ActionFunction, TSchema extends ZodSchema> = Exclude<ActionReturnType<TAction>, InvalidSubmissionResponse<ReturnType<Submission<z.infer<TSchema>>["reply"]>> | ErrorResponse<null>>;


interface UseActionOptions<TAction extends ActionFunction, TSchema extends ZodSchema> {
  path?: string;

  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  onSuccess?(response: SuccessResponseData<TAction, TSchema>): void;

  onError?(response: InvalidSubmissionResponse<ReturnType<Submission<z.infer<TSchema>>["reply"]>> | ErrorResponse<unknown>): void;
}

function useAction<TAction extends ActionFunction, TSchema extends ZodSchema>(options: UseActionOptions<TAction, TSchema>) {
  const fetcher = useFetcher<TAction>() as FetcherWithComponents<ActionReturnType<TAction>>;
  const submit = (data: z.infer<TSchema>) => {
    fetcher.submit(serializeToFormData(data), {
      method: options.method,
      action: options.path
    });
  };
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const response = fetcher.data;
      if (isSuccessResponse(response)) {
        options.onSuccess?.(response as SuccessResponseData<TAction, TSchema>);
      } else {
        options.onError?.(response);
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

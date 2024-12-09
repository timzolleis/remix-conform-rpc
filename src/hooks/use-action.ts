import { z, ZodSchema } from 'zod';
import { ActionFunction } from '@remix-run/server-runtime';
import { useFetcher } from '@remix-run/react';
import { FormEvent, useEffect } from 'react';
import { ErrorResponse, isErrorResponse } from '../utils/error';
import { DefaultValue, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';

type ActionReturnType<TAction extends ActionFunction> = Awaited<ReturnType<TAction>>;

interface UseActionOptions<TAction extends ActionFunction> {
  path?: string;

  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  onSuccess?(response: ActionReturnType<TAction>): void;

  onError?(response: ErrorResponse<ActionReturnType<TAction>>): void;
}

function useAction<TAction extends ActionFunction, TSchema extends ZodSchema>(options: UseActionOptions<TAction>) {
  const fetcher = useFetcher<TAction>();
  const submit = (data: z.infer<TSchema>) => {
    fetcher.submit(data, {
      method: options.method,
      action: options.path
    });
  };
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      if (isErrorResponse<ActionReturnType<TAction>>(fetcher.data)) {
        options.onError?.(fetcher.data);
      } else {
        options.onSuccess?.(fetcher.data);
      }
    }
  }, [fetcher.data]);

  return { submit, fetcher };
}

interface UseActionFormOptions<TAction extends ActionFunction, TSchema extends ZodSchema>
  extends UseActionOptions<TAction> {
  schema: TSchema;
  onFormSubmit?: (event: FormEvent<HTMLFormElement>, data: z.infer<TSchema>) => void;
  defaultValue: DefaultValue<TSchema>;
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
      if (submission?.status !== 'success') {
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

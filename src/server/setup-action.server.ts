import type { ActionFunctionArgs } from "@remix-run/server-runtime";

import { parseWithZod } from "@conform-to/zod";
import { getParamsOrFail, getSearchParamsOrFail } from "remix-params-helper";
import { z, ZodSchema } from "zod";
import { invalidSubmission } from "./response.server.js";
import type { SuccessfulSubmission } from "../utils/submission.js";
import type { WithParams } from "../utils/with-params.js";
import { respondWithError } from "../utils/error.js";

type ActionArguments<
  TSchema extends ZodSchema,
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined
> = WithParams<
  TParamSchema,
  TQuerySchema,
  {
    submission: SuccessfulSubmission<z.infer<TSchema>>;
    request: ActionFunctionArgs['request'];
    context: ActionFunctionArgs['context'];
  }
>;

interface SetupActionsArgs<
  TSchema extends ZodSchema,
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult,
  TMiddlewareResult
> {
  actionArgs: ActionFunctionArgs;
  paramSchema?: TParamSchema;
  querySchema?: TQuerySchema;
  schema: TSchema;
  mutation: (
    args: ActionArguments<TSchema, TParamSchema, TQuerySchema> &
      (TMiddlewareResult extends undefined ? {} : TMiddlewareResult)
  ) => Promise<TResult>;
  middleware?: (args: ActionArguments<TSchema, TParamSchema, TQuerySchema>) => Promise<TMiddlewareResult>;
}

async function setupAction<
  TSchema extends ZodSchema,
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult,
  TMiddlewareResult
>({
  actionArgs,
  schema,
  mutation,
  querySchema,
  paramSchema,
  middleware
}: SetupActionsArgs<TSchema, TParamSchema, TQuerySchema, TResult, TMiddlewareResult>) {
  const formData = await actionArgs.request.formData();
  const submission = parseWithZod(formData, {
    schema
  });
  if (submission.status !== 'success') {
    return invalidSubmission(submission);
  }
  const params = paramSchema ? getParamsOrFail(actionArgs.params, paramSchema) : undefined;
  const query = querySchema ? getSearchParamsOrFail(actionArgs.request, querySchema) : undefined;
  const mutationArgs: ActionArguments<TSchema, TParamSchema, TQuerySchema> = {
    submission: submission,
    request: actionArgs.request,
    context: actionArgs.context,
    ...(params && { params }),
    ...(query && { query })
  } as ActionArguments<TSchema, TParamSchema, TQuerySchema>;
  const middlewareResult = middleware ? await middleware(mutationArgs) : undefined;
  try {
    return mutation({
      ...mutationArgs,
      ...(middlewareResult as TMiddlewareResult extends undefined ? {} : TMiddlewareResult)
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    return respondWithError(submission.reply(), {
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export { setupAction };

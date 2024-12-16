import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { getParamsOrFail, getSearchParamsOrFail } from "remix-params-helper";
import { ZodSchema } from "zod";
import { errorResponse } from "./response.server.js";
import type { WithParams } from "../utils/with-params.js";

type LoaderArguments<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined
> = WithParams<
  TParamSchema,
  TQuerySchema,
  {
    request: LoaderFunctionArgs["request"];
    context: LoaderFunctionArgs["context"];
  }
>;

interface SetupLoaderArgs<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult,
  TMiddlewareResult
> {
  context: ActionFunctionArgs;
  paramSchema?: TParamSchema;
  querySchema?: TQuerySchema;
  load: (
    args: LoaderArguments<TParamSchema, TQuerySchema> & (TMiddlewareResult extends undefined ? {} : TMiddlewareResult)
  ) => Promise<TResult>;
  middleware?: (args: LoaderArguments<TParamSchema, TQuerySchema>) => Promise<TMiddlewareResult>;
}

async function setupLoader<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult,
  TMiddlewareResult
>({
    context,
    querySchema,
    load,
    paramSchema,
    middleware
  }: SetupLoaderArgs<TParamSchema, TQuerySchema, TResult, TMiddlewareResult>) {
  const params = paramSchema ? getParamsOrFail(context.params, paramSchema) : undefined;
  const query = querySchema ? getSearchParamsOrFail(context.request, querySchema) : undefined;
  const loadArgs: LoaderArguments<TParamSchema, TQuerySchema> = {
    request: context.request,
    context: context.context,
    ...(params && { params }),
    ...(query && { query })
  } as LoaderArguments<TParamSchema, TQuerySchema>;
  const middlewareResult = middleware ? await middleware(loadArgs) : undefined;
  try {
    return load({ ...loadArgs, ...(middlewareResult as TMiddlewareResult extends undefined ? {} : TMiddlewareResult) });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw errorResponse({ error });
  }
}

export { setupLoader };

import { getParamsOrFail, getSearchParamsOrFail } from "remix-params-helper";
import { ZodSchema } from "zod";
import type { WithParams } from "../utils/with-params.js";
import { respondWithError } from "../utils/error.js";
import type { LoaderFunctionArgs } from "react-router";

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
  loaderArgs: LoaderFunctionArgs;
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
    loaderArgs,
    querySchema,
    load,
    paramSchema,
    middleware
  }: SetupLoaderArgs<TParamSchema, TQuerySchema, TResult, TMiddlewareResult>) {
  const params = paramSchema ? getParamsOrFail(loaderArgs.params, paramSchema) : undefined;
  const query = querySchema ? getSearchParamsOrFail(loaderArgs.request, querySchema) : undefined;
  const loadArgs: LoaderArguments<TParamSchema, TQuerySchema> = {
    request: loaderArgs.request,
    context: loaderArgs.context,
    ...(params && { params }),
    ...(query && { query })
  } as LoaderArguments<TParamSchema, TQuerySchema>;
  const middlewareResult = middleware ? await middleware(loadArgs) : undefined;
  try {
    return await load({ ...loadArgs, ...(middlewareResult as TMiddlewareResult extends undefined ? {} : TMiddlewareResult) });
  } catch (thrownValue) {
    if (thrownValue instanceof Response) {
      throw thrownValue;
    }
    throw respondWithError(null, {
      message: thrownValue instanceof Error ? thrownValue.message : "unknown_error",
      code: 500
    });
  }
}

export { setupLoader };

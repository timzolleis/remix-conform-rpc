import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/server-runtime';
import { getParamsOrFail } from 'remix-params-helper';
import { ZodSchema } from 'zod';
import { errorResponse } from './response.server';
import { WithParams } from '../utils/with-params';

type LoaderArguments<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined
> = WithParams<
  TParamSchema,
  TQuerySchema,
  {
    request: LoaderFunctionArgs['request'];
    context: LoaderFunctionArgs['context'];
  }
>;

interface SetupLoaderArgs<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult
> {
  context: ActionFunctionArgs;
  paramSchema?: TParamSchema;
  querySchema?: TParamSchema;
  load: (args: LoaderArguments<TParamSchema, TQuerySchema>) => Promise<TResult>;
}

async function setupLoader<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TResult
>({ context, querySchema, load, paramSchema }: SetupLoaderArgs<TParamSchema, TQuerySchema, TResult>) {
  const params = paramSchema ? getParamsOrFail(context.params, paramSchema) : undefined;
  const query = querySchema ? getParamsOrFail(context.params, querySchema) : undefined;
  const loadArgs: LoaderArguments<TParamSchema, TQuerySchema> = {
    request: context.request,
    context: context.context,
    ...(params && { params }),
    ...(query && { query })
  } as LoaderArguments<TParamSchema, TQuerySchema>;
  try {
    return load(loadArgs);
  } catch (error) {
    return errorResponse({ error });
  }
}

export { setupLoader };

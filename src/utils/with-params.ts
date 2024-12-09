import { z, ZodSchema } from 'zod';

export type WithParams<
  TParamSchema extends ZodSchema | undefined,
  TQuerySchema extends ZodSchema | undefined,
  TData
> = TData &
  (TParamSchema extends ZodSchema ? { params: z.infer<TParamSchema> } : Record<never, never>) &
  (TQuerySchema extends ZodSchema ? { query: z.infer<TQuerySchema> } : Record<never, never>);

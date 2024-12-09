import { setupLoader } from '../src/server/setup-loader.server';
import { describe, expect, it } from 'vitest';
import { set, z, ZodError } from 'zod';
import { setupAction } from '../src/server/setup-action.server';

describe('setup action', () => {
  it('should parse form data', async () => {
    const formData = new FormData();
    formData.append('test', 'data');
    formData.append('checkbox', 'on');
    const context = {
      request: new Request('http://localhost', { method: 'POST', body: formData }),
      context: {},
      params: {}
    };
    const result = await setupAction({
      context,
      schema: z.object({
        test: z.string(),
        checkbox: z.boolean()
      }),
      mutation: async ({ submission }) => {
        return submission.value;
      }
    });
    expect(result).toStrictEqual({ test: 'data', checkbox: true });
  });

  it('should parse params and query', async () => {
    const formData = new FormData();
    formData.append('test', 'data');
    formData.append('checkbox', 'on');
    const context = {
      request: new Request('http://localhost?test=value', { method: 'POST', body: formData }),
      context: {},
      params: {
        test: 'value'
      }
    };
    const result = await setupAction({
      context,
      paramSchema: z.object({
        test: z.string()
      }),
      schema: z.object({
        test: z.string(),
        checkbox: z.boolean()
      }),
      querySchema: z.object({
        test: z.string()
      }),
      mutation: async ({ submission, params, query }) => {
        return { submission: submission.value, params, query };
      }
    });
    expect(result).toStrictEqual({
      submission: { test: 'data', checkbox: true },
      params: { test: 'value' },
      query: { test: 'value' }
    });
  });

  it('should throw an error parsing params', async () => {
    const formData = new FormData();
    formData.append('test', 'data');
    formData.append('checkbox', 'on');
    const context = {
      request: new Request('http://localhost?test=value', { method: 'POST', body: formData }),
      context: {},
      params: {}
    };
    try {
      const result = await setupAction({
        context,
        paramSchema: z.object({
          test: z.string()
        }),
        schema: z.object({
          test: z.string(),
          checkbox: z.boolean()
        }),
        mutation: async ({ submission, params }) => {
          return { submission: submission.value, params };
        }
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('{"test":"Required"}');
    }
  });

  it('should throw an error parsing query', async () => {
    const formData = new FormData();
    formData.append('test', 'data');
    formData.append('checkbox', 'on');
    const context = {
      request: new Request('http://localhost', { method: 'POST', body: formData }),
      context: {},
      params: {}
    };
    try {
      const result = await setupAction({
        context,
        querySchema: z.object({
          test: z.string()
        }),
        schema: z.object({
          test: z.string(),
          checkbox: z.boolean()
        }),
        mutation: async ({ submission, query }) => {
          return { submission: submission.value, query };
        }
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('{"test":"Required"}');
    }
  });

  it('should run action middleware', async () => {
    const formData = new FormData();
    formData.append('test', 'data');
    formData.append('checkbox', 'on');
    const context = {
      request: new Request('http://localhost', { method: 'POST', body: formData }),
      context: {},
      params: {}
    };
    const result = await setupAction({
      context,
      schema: z.object({
        test: z.string(),
        checkbox: z.boolean()
      }),
      mutation: async ({ submission, user }) => {
        return { ...submission.value, user };
      },
      middleware: async () => {
        return { user: 'test' };
      }
    });
    expect(result).toStrictEqual({ test: 'data', checkbox: true, user: 'test' });
  });
});

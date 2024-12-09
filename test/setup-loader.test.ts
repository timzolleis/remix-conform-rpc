import { setupLoader } from '../src/server/setup-loader.server';
import { describe, expect, it } from 'vitest';
import { set, z, ZodError } from 'zod';

describe('setupLoader', () => {
  it('should return the result of the load function', async () => {
    const context = {
      request: new Request('http://localhost', { method: 'GET' }),
      context: {},
      params: {}
    };
    const result = await setupLoader({
      context,
      load: async () => {
        return 'data';
      }
    });
    expect(result).toBe('data');
  });

  it('should parse params and query successfully', async () => {
    const context = {
      request: new Request('http://localhost?test=value', { method: 'GET' }),
      context: {},
      params: {
        test: 'value'
      }
    };
    const result = await setupLoader({
      context,
      load: async ({ params, query }) => {
        return { params, query };
      },
      paramSchema: z.object({
        test: z.string()
      }),
      querySchema: z.object({
        test: z.string()
      })
    });
    expect(result).toEqual({
      params: { test: 'value' },
      query: { test: 'value' }
    });
  });
  it('should throw an error parsing params', async () => {
    const context = {
      request: new Request('http://localhost', { method: 'GET' }),
      context: {},
      params: {}
    };
    try {
      await setupLoader({
        context,
        load: async ({ params, query }) => {
          return { params, query };
        },
        paramSchema: z.object({
          test: z.number()
        }),
        querySchema: z.object({
          test: z.number()
        })
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('{"test":"Required"}');
    }
  });
  it('should throw an error parsing query', async () => {
    const context = {
      request: new Request('http://localhost', { method: 'GET' }),
      context: {},
      params: {}
    };
    try {
      await setupLoader({
        context,
        load: async ({ query }) => {
          return { query };
        },
        querySchema: z.object({
          test: z.number()
        })
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('{"test":"Required"}');
    }
  });
  it('should run loader middleware', async () => {
    const context = {
      request: new Request('http://localhost', { method: 'GET' }),
      context: {},
      params: {}
    };
    const result = await setupLoader({
      context,
      middleware: async ({}) => {
        return { user: 'test' };
      },
      load: async ({ user }) => {
        return { user };
      }
    });
    expect(result).toEqual({ user: 'test' });
  });
});

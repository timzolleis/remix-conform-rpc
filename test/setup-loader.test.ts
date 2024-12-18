import { setupLoader } from "../src/server/setup-loader.server.js";
import { describe, expect, it } from "vitest";
import { set, z, ZodError } from "zod";

describe("setupLoader", () => {
  it("should return the result of the load function", async () => {
    const loaderArgs = {
      request: new Request("http://localhost", { method: "GET" }),
      context: {},
      params: {}
    };
    const result = await setupLoader({
      loaderArgs,
      load: async () => {
        return "data";
      }
    });
    expect(result).toBe("data");
  });

  it("should parse params and query successfully", async () => {
    const loaderArgs = {
      request: new Request("http://localhost?query=value", { method: "GET" }),
      context: {},
      params: {
        params: "value"
      }
    };
    const result = await setupLoader({
      loaderArgs,
      load: async ({ params, query }) => {
        return { params, query };
      },
      paramSchema: z.object({
        params: z.string()
      }),
      querySchema: z.object({
        query: z.string()
      })
    });
    expect(result).toEqual({
      params: { params: "value" },
      query: { query: "value" }
    });
  });
  it("should throw an error parsing params", async () => {
    const loaderArgs = {
      request: new Request("http://localhost", { method: "GET" }),
      context: {},
      params: {}
    };
    try {
      await setupLoader({
        loaderArgs,
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
      expect((error as Error).message).toEqual("{\"test\":\"Required\"}");
    }
  });
  it("should throw an error parsing query", async () => {
    const loaderArgs = {
      request: new Request("http://localhost", { method: "GET" }),
      context: {},
      params: {}
    };
    try {
      await setupLoader({
        loaderArgs,
        load: async ({ query }) => {
          return { query };
        },
        querySchema: z.object({
          test: z.number()
        })
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual("{\"test\":\"Required\"}");
    }
  });
  it("should run loader middleware", async () => {
    const loaderArgs = {
      request: new Request("http://localhost", { method: "GET" }),
      context: {},
      params: {}
    };
    const result = await setupLoader({
      loaderArgs,
      middleware: async ({}) => {
        return { user: "test" };
      },
      load: async ({ user }) => {
        return { user };
      }
    });
    expect(result).toEqual({ user: "test" });
  });
});

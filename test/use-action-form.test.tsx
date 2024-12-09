import { useActionForm } from "../src/hooks/use-action";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { useFetcher } from "@remix-run/react";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { z } from "zod";
import { getFormProps } from "@conform-to/react";

vi.mock("@remix-run/react", () => ({
  useFetcher: vi.fn()
}));

const setupFetcher = () => {
  const mockFetcher = {
    submit: vi.fn(),
    state: "idle",
    data: null as any
  };
  (useFetcher as Mock).mockReturnValue(mockFetcher);
  return mockFetcher;
};

const schema = z.object({
  name: z.string(),
  description: z.string()
});

describe("useAction", () => {
  const mockFetcher = setupFetcher();


  beforeEach(() => {
    (useFetcher as Mock).mockReturnValue(mockFetcher);
  });

  it("should use the onSubmit event on the form", () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onFormSubmit = vi.fn();
    const { result } = renderHook(() => useActionForm({
      method: "POST" as const,
      path: "/test",
      schema,
      onSuccess,
      onError,
      onFormSubmit
    }));
    const form = result.current.form;
    expect(form.onSubmit).toBeDefined();
    const fields = result.current.fields;
    const { container } = render(
      <form {...getFormProps(form)} method={"post"}>
        <input type="text" name={fields.name.name} defaultValue={"value"} />
        <input type="text" name={fields.description.name} defaultValue={"value"} />
        <button type="submit">Submit</button>
      </form>
    );
    const submitButton = container.querySelector("button[type=\"submit\"]");
    act(() => {
      fireEvent.click(submitButton!);
    });
    expect(onFormSubmit).toHaveBeenCalledWith(expect.anything(), {
      name: "value",
      description: "value"
    });
  });


  it("should call onSuccess when fetcher data is not an error", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const options = {
      method: "POST" as const,
      path: "/test",
      schema,
      onSuccess,
      onError,
      defaultValue: { name: "test", description: "testDescription" }
    };

    const { result, rerender } = renderHook(() => useActionForm(options));
    const fields = result.current.fields;
    expect(fields.name.name).toBe("name");
    expect(fields.name.initialValue).toBe("test");
    expect(fields.description.name).toBe("description");
    expect(fields.description.initialValue).toBe("testDescription");
    const form = result.current.form;

    act(() => {
      result.current.submit({ name: "value", description: "value" });
    });

    expect(mockFetcher.submit).toHaveBeenCalledWith({ name: "value", description: "value" }, {
      method: "POST",
      action: "/test"
    });

    act(() => {
      mockFetcher.data = { success: true };
      mockFetcher.state = "idle";
      rerender();
    });

    expect(onSuccess).toHaveBeenCalledWith({ success: true });
    expect(onError).not.toHaveBeenCalled();
  });
});

describe("useAction error", () => {
  const mockFetcher = setupFetcher();

  beforeEach(() => {
    (useFetcher as Mock).mockReturnValue(mockFetcher);
  });
  it("should call onError when fetcher data is an error", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const options = {
      method: "POST" as const,
      path: "/test",
      onSuccess,
      schema,
      onError
    };

    const { result, rerender } = renderHook(() => useActionForm(options));

    act(() => {
      result.current.submit({ name: "value", description: "description" });
    });

    expect(mockFetcher.submit).toHaveBeenCalledWith({ name: "value", description: "description" }, {
      method: "POST",
      action: "/test"
    });

    act(() => {
      mockFetcher.data = { status: "error" };
      mockFetcher.state = "idle";
      rerender();
    });

    expect(onError).toHaveBeenCalledWith({ status: "error" });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
import { useAction } from '../src/hooks/use-action.js';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFetcher } from "react-router";

function waitForFetcher() {
  return new Promise((resolve) => setTimeout(resolve, 1));
}


vi.mock('react-router', () => ({
  useFetcher: vi.fn()
}));

function mockSubmit() {
  return Promise.resolve();
}
const setupFetcher = () => {
  const mockFetcher = {
    submit: vi.fn(mockSubmit),
    state: 'idle',
    data: null as any
  };
  (useFetcher as Mock).mockReturnValue(mockFetcher);
  return mockFetcher;
};

describe('useAction', async () => {
  const mockFetcher = setupFetcher();

  beforeEach(() => {
    (useFetcher as Mock).mockReturnValue(mockFetcher);
  });

  it('should call onSuccess when fetcher data is not an error', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const options = {
      method: 'POST' as const,
      path: '/test',
      onSuccess,
      onError
    };

    const { result, rerender } = renderHook(() => useAction(options));

    act(() => {
      result.current.submit({ key: 'value' });
    });

    const expectedFormData = new FormData();
    expectedFormData.append('key', 'value');
    expect(mockFetcher.submit).toHaveBeenCalledWith(expectedFormData, { method: 'POST', action: '/test' });
    act(() => {
      mockFetcher.data = { success: true };
      mockFetcher.state = 'idle';
      rerender();
    });
    await waitForFetcher();
    expect(onSuccess).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ success: true });
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('useAction error', () => {
  const mockFetcher = setupFetcher();

  beforeEach(() => {
    (useFetcher as Mock).mockReturnValue(mockFetcher);
  });
  it('should call onError when fetcher data is an error', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const options = {
      method: 'POST' as const,
      path: '/test',
      onSuccess,
      onError
    };
    const { result, rerender } = renderHook(() => useAction(options));

    const expectedFormData = new FormData();
    expectedFormData.append('key', 'value');

    act(() => {
      result.current.submit({ key: 'value' });
    });

    expect(mockFetcher.submit).toHaveBeenCalledWith(expectedFormData, { method: 'POST', action: '/test' });

    act(() => {
      mockFetcher.data = { status: 'error' };
      mockFetcher.state = 'idle';
      rerender();
    });
    await waitForFetcher();
    expect(onError).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith({ status: 'error' });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

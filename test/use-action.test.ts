import { useAction } from '../src/hooks/use-action.js';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useFetcher } from '@remix-run/react';
import { act, renderHook } from '@testing-library/react';

vi.mock('@remix-run/react', () => ({
  useFetcher: vi.fn()
}));

const setupFetcher = () => {
  const mockFetcher = {
    submit: vi.fn(),
    state: 'idle',
    data: null as any
  };
  (useFetcher as Mock).mockReturnValue(mockFetcher);
  return mockFetcher;
};

describe('useAction', () => {
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

    expect(mockFetcher.submit).toHaveBeenCalledWith({ key: 'value' }, { method: 'POST', action: '/test' });

    act(() => {
      mockFetcher.data = { success: true };
      mockFetcher.state = 'idle';
      rerender();
    });

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

    act(() => {
      result.current.submit({ key: 'value' });
    });

    expect(mockFetcher.submit).toHaveBeenCalledWith({ key: 'value' }, { method: 'POST', action: '/test' });

    act(() => {
      mockFetcher.data = { status: 'error' };
      mockFetcher.state = 'idle';
      rerender();
    });

    expect(onError).toHaveBeenCalledWith({ status: 'error' });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

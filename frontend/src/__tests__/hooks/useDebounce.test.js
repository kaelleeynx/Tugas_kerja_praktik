import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useDebounce from '../../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // ─── Happy Path ──────────────────────────────────────────────────────

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should return the same value before delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );
    rerender({ value: 'updated', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('initial');
  });

  it('should return the updated value after delay has passed', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );
    rerender({ value: 'updated', delay: 300 });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('updated');
  });

  it('should use 300ms as default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'first' } }
    );
    rerender({ value: 'second' });
    act(() => { vi.advanceTimersByTime(299); });
    expect(result.current).toBe('first');
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('second');
  });

  // ─── Edge Cases ──────────────────────────────────────────────────────

  it('should reset timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );
    rerender({ value: 'ab', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });
    rerender({ value: 'abc', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); });
    expect(result.current).toBe('a');
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe('abc');
  });

  it('should handle empty string value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'something' } }
    );
    rerender({ value: '' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('');
  });

  it('should handle numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 0 } }
    );
    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(42);
  });

  it('should handle custom delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'start', delay: 1000 } }
    );
    rerender({ value: 'end', delay: 1000 });
    act(() => { vi.advanceTimersByTime(999); });
    expect(result.current).toBe('start');
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('end');
  });
});

// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDayzModSearch } from '@renderer/hooks/useDayzModSearch';
import '../setupTests';

describe('useDayzModSearch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // IntersectionObserver mock for useEffect
    class MockIntersectionObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDayzModSearch());
    
    expect(result.current.searchQuery).toBe('');
    expect(result.current.activeCategory).toBe(9);
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should strip BBCode correctly', () => {
    const { result } = renderHook(() => useDayzModSearch());
    
    const stripped = result.current.stripBBCode('[b]Hello[/b] [url=https://example.com]Link[/url]');
    expect(stripped).toBe('Hello Link');
  });

  it('should fetch results and update state on handleSearch', async () => {
    const mockResponse = [{ title: 'Cool Mod' }, { title: 'Another Mod' }];
    (window as any).api.steam = {
      searchWorkshop: vi.fn().mockResolvedValue(mockResponse)
    };

    const { result } = renderHook(() => useDayzModSearch());
    
    await act(async () => {
      await result.current.handleSearch('test', 9, 1);
    });

    expect((window as any).api.steam.searchWorkshop).toHaveBeenCalledWith('test', 9, 1, []);
    expect(result.current.results).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.page).toBe(1);
    expect(result.current.hasMore).toBe(true);
  });
});

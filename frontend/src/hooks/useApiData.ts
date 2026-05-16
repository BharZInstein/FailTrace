"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ApiState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export default function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: { pollIntervalMs?: number }
): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void depsKey;
    mountedRef.current = true;
    void Promise.resolve().then(load);

    let interval: NodeJS.Timeout | null = null;
    if (options?.pollIntervalMs) {
      interval = setInterval(load, options.pollIntervalMs);
    }
    return () => {
      mountedRef.current = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [load, options?.pollIntervalMs, depsKey]);

  return { data, isLoading, error, refetch: load };
}

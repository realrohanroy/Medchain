
import { useState, useEffect } from 'react';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

type FetchFunction<T> = () => Promise<{
  data: T | null;
  error: string | null;
}>;

export const useSupabaseQuery = <T,>(
  queryKey: string[],
  fetchFn: FetchFunction<T>,
  options?: UseQueryOptions<{
    data: T | null;
    error: string | null;
  }>
) => {
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    ...options,
  });
};

export const useSupabaseLiveQuery = <T,>(
  queryKey: string[],
  fetchFn: FetchFunction<T>,
  tableName: string,
  options?: UseQueryOptions<{
    data: T | null;
    error: string | null;
  }>
) => {
  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    ...options,
  });

  return query;
};

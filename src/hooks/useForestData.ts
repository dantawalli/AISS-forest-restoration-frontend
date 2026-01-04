import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: api.getSummary,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: api.getCountries,
  });
}

export function useLossTrend(country?: string) {
  return useQuery({
    queryKey: ['loss-trend', country],
    queryFn: () => api.getLossTrend(country),
  });
}

export function useDrivers(country?: string, year?: number) {
  return useQuery({
    queryKey: ['drivers', country, year],
    queryFn: () => api.getDrivers(country),
  });
}

export function useEmissions(country?: string) {
  return useQuery({
    queryKey: ['emissions', country],
    queryFn: () => api.getEmissions(country),
  });
}

export function useMapData(year?: number) {
  return useQuery({
    queryKey: ['map-data', year],
    queryFn: () => api.getMapData(year ? year : undefined),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - data doesn't change frequently
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
}

export function usePrediction(country: string, targetYear: number) {
  return useQuery({
    queryKey: ['prediction', country, targetYear],
    queryFn: () => api.getPrediction(country, targetYear),
    enabled: !!country && !!targetYear,
  });
}

export function useMultiCountryPrediction(countries: string[], targetYear: number) {
  return useQuery({
    queryKey: ['multi-prediction', countries, targetYear],
    queryFn: () => api.getMultiCountryPrediction(countries, targetYear),
    enabled: !!countries && countries.length > 0 && !!targetYear,
  });
}

export function usePrimaryMapData(year?: number) {
  return useQuery({
    queryKey: ['primary-map-data', year],
    queryFn: async () => {
      if (!year) return [];
      const data = await api.getPrimaryLossAllCountries(year, year);
      // Convert to MapData format
      return data.map(item => ({
        country: item.country,
        year: year,
        tree_cover_loss_ha: item.primary_forest_loss_ha
      }));
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours cache
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
    refetchOnWindowFocus: false, // No refetch on focus
    refetchOnMount: false, // No refetch on mount
    refetchOnReconnect: false, // No refetch on reconnect
    enabled: !!year, // Only fetch if year is provided
  });
}

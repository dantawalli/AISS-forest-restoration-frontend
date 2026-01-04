import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  RecommendationContext, 
  RecommendationResponse, 
  InsightRequest, 
  InsightResponse, 
  TemplatesResponse 
} from '@/types/recommendations';

export const useRecommendations = (context: RecommendationContext, options?: { enabled?: boolean }) => {
  const result = useQuery({
    queryKey: ['recommendations', context.country, context.stakeholder, context.dataRange],
    queryFn: () => api.getRecommendations(context),
    enabled: options?.enabled ?? (!!context.country && !!context.stakeholder),
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: (failureCount, error) => {
      // Retry more times for LLM timeout errors
      if (error?.message?.includes('504') || error?.message?.includes('Gateway Timeout')) {
        return failureCount < 5; // Allow 5 retries for timeouts
      }
      return failureCount < 3; // Default 3 retries for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff, max 30s
  });

  return {
    ...result,
    refetch: result.refetch
  };
};

export const useInsights = (request: InsightRequest) => {
  return useQuery({
    queryKey: ['insights', request.countries, request.metrics, request.analysisType],
    queryFn: () => api.getInsights(request),
    enabled: request.countries.length > 0 && request.metrics.length > 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  }) as {
    data: InsightResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };
};

export const useRecommendationTemplates = () => {
  return useQuery({
    queryKey: ['recommendation-templates'],
    queryFn: () => api.getRecommendationTemplates(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
  }) as {
    data: TemplatesResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };
};

export const useInvalidateRecommendations = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateRecommendations: (country?: string) => {
      if (country) {
        queryClient.invalidateQueries({ queryKey: ['recommendations', country] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      }
    },
    invalidateInsights: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
  };
};

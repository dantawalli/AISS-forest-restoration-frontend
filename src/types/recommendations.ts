export interface RecommendationContext {
  country: string;
  stakeholder: StakeholderType;
  dataRange: {
    startYear: number;
    endYear: number;
  };
  includePredictions?: boolean;
  language?: string;
}

export type StakeholderType = 'policy_governance' | 'academic_research' | 'environmental_ngo' | 'corporate_sustainability';

export interface RecommendationResponse {
  success: boolean;
  data: RecommendationData;
}

export interface RecommendationData {
  country: string;
  stakeholder: StakeholderType;
  generatedAt: string;
  summary: string;
  recommendations: Recommendation[];
}

export interface Recommendation {
  text: {
    Objective: string;
    "Specific Actions": string[];
    "Implementation Timeframe": string;
    "Required Resources": string[];
    "Expected Measurable Impact": string;
    "Supporting Evidence from Data": string;
  };
}

export interface Insights {
  keyDrivers: string[];
  trendAnalysis: string;
  regionalComparison: string;
  riskFactors: string[];
}

export interface ComparativeData {
  regionalAverage: number;
  countryRank: number;
  totalCountries: number;
  percentile: number;
}

export interface InsightRequest {
  countries: string[];
  metrics: string[];
  timeframe: string;
  analysisType: 'comparative' | 'trend' | 'correlation';
}

export interface InsightResponse {
  success: boolean;
  data: InsightData;
}

export interface InsightData {
  countries: string[];
  metrics: string[];
  timeframe: string;
  analysisType: string;
  generatedAt: string;
  insights: Insight[];
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  data: {
    metric: string;
    value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
  };
  recommendations: string[];
  sources: string[];
}

export interface TemplatesResponse {
  success: boolean;
  data: Template[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  stakeholder: StakeholderType;
  category: string;
  questions: TemplateQuestion[];
}

export interface TemplateQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
}

export interface AnalysisType {
  id: string;
  name: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

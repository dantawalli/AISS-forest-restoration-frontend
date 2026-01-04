// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://98.86.169.128';

/* =======================
   Interfaces (Backend-aligned)
   ======================= */

export interface SummaryData {
  countries: number;
  total_loss: number;
  total_emissions: number;
  latest_year: number;
}

export interface Country {
  code: string;
  name: string;
}

export interface LossTrendData {
  year: number;
  tree_cover_loss_ha: number;
  primary_forest_loss_ha?: number;
}

export interface CumulativeLossTrendData {
  year: number;
  cumulative_tree_cover_loss_ha: number;
}

export interface CumulativePrimaryLossTrendData {
  year: number;
  cumulative_primary_forest_loss_ha: number;
}

export interface CumulativeDriversData {
  driver: string;
  cumulative_hectares: number;
  percentage: number;
}

export interface CumulativeTreeCoverLossData {
  country: string;
  cumulative_tree_cover_loss_ha: number;
}

export interface DriversData {
  driver: string;
  hectares: number;
  percentage?: number;
}

export interface EmissionsData {
  year: number;
  tree_cover_loss_ha: number;
  carbon_gross_emissions_MgCO2e: number;
}

export interface MapData {
  country: string;
  year?: number;
  tree_cover_loss_ha: number;
}

export interface PredictionResponse {
  historical: { year: number; tree_cover_loss_ha: number }[];
  predictions: { year: number; tree_cover_loss_ha: number }[];
  last_year: number;
  target_year: number;
  target_prediction: number;
  avg_historical: number;
  change_pct: number;
}

export interface MultiCountryPredictionResponse {
  target_year: number;
  countries_processed: number;
  results: { [country: string]: PredictionResponse };
  errors: { [country: string]: string };
  countries_with_errors: number;
}

/* =======================
   Helpers
   ======================= */

async function fetchGET<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.append(k, String(v))
    );
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

async function fetchPOST<T>(
  endpoint: string,
  body: Record<string, string | number | string[]>,
  timeout: number = 60000 // 60 second timeout for LLM endpoints
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - The AI service is taking longer than expected. Please try again.');
      }
      if (error.message.includes('504') || error.message.includes('Gateway Timeout')) {
        throw new Error('504 Gateway Timeout - The AI service is currently experiencing high demand. Please try again in a few moments.');
      }
    }
    
    throw error;
  }
}

/* =======================
   API
   ======================= */

export const api = {
  /* ---- Always safe ---- */
  getSummary: () => fetchGET<SummaryData>('/api/summary'),

  getCountries: () => fetchGET<string[]>('/api/countries').then(countries => 
  countries.map(name => {
    // Comprehensive country name to ISO 3166-1 alpha-3 mapping
    const codeMap: { [key: string]: string } = {
      // Major countries with forest data
      'Afghanistan': 'AFG',
      'Albania': 'ALB',
      'Algeria': 'DZA',
      'Angola': 'AGO',
      'Argentina': 'ARG',
      'Australia': 'AUS',
      'Austria': 'AUT',
      'Azerbaijan': 'AZE',
      'Bangladesh': 'BGD',
      'Belarus': 'BLR',
      'Belgium': 'BEL',
      'Belize': 'BLZ',
      'Benin': 'BEN',
      'Bhutan': 'BTN',
      'Bolivia': 'BOL',
      'Bosnia And Herzegovina': 'BIH',
      'Botswana': 'BWA',
      'Brazil': 'BRA',
      'Brunei': 'BRN',
      'Bulgaria': 'BGR',
      'Burkina Faso': 'BFA',
      'Burundi': 'BDI',
      'Cambodia': 'KHM',
      'Cameroon': 'CMR',
      'Canada': 'CAN',
      'Central African Republic': 'CAF',
      'Chad': 'TCD',
      'Chile': 'CHL',
      'China': 'CHN',
      'Colombia': 'COL',
      'Costa Rica': 'CRI',
      'Croatia': 'HRV',
      'Cuba': 'CUB',
      'Czechia': 'CZE',
      'Côte d\'Ivoire': 'CIV',
      'Democratic Republic Of The Congo': 'COD',
      'Denmark': 'DNK',
      'Djibouti': 'DJI',
      'Dominican Republic': 'DOM',
      'Ecuador': 'ECU',
      'Egypt': 'EGY',
      'El Salvador': 'SLV',
      'Equatorial Guinea': 'GNQ',
      'Eritrea': 'ERI',
      'Estonia': 'EST',
      'Ethiopia': 'ETH',
      'Faroe Islands': 'FRO',
      'Fiji': 'FJI',
      'Finland': 'FIN',
      'France': 'FRA',
      'French Guiana': 'GUF',
      'Gabon': 'GAB',
      'Gambia': 'GMB',
      'Georgia': 'GEO',
      'Germany': 'DEU',
      'Ghana': 'GHA',
      'Greece': 'GRC',
      'Guadeloupe': 'GLP',
      'Guatemala': 'GTM',
      'Guinea': 'GIN',
      'Guinea-Bissau': 'GNB',
      'Guyana': 'GUY',
      'Haiti': 'HTI',
      'Honduras': 'HND',
      'Hungary': 'HUN',
      'Iceland': 'ISL',
      'India': 'IND',
      'Indonesia': 'IDN',
      'Iran': 'IRN',
      'Iraq': 'IRQ',
      'Ireland': 'IRL',
      'Italy': 'ITA',
      'Japan': 'JPN',
      'Jordan': 'JOR',
      'Kazakhstan': 'KAZ',
      'Kenya': 'KEN',
      'Kosovo': 'XKX',
      'Kyrgyzstan': 'KGZ',
      'Laos': 'LAO',
      'Latvia': 'LVA',
      'Lebanon': 'LBN',
      'Liberia': 'LBR',
      'Lithuania': 'LTU',
      'Luxembourg': 'LUX',
      'Madagascar': 'MDG',
      'Malawi': 'MWI',
      'Malaysia': 'MYS',
      'Mali': 'MLI',
      'Malta': 'MLT',
      'Martinique': 'MTQ',
      'Mauritania': 'MRT',
      'Micronesia': 'FSM',
      'Mongolia': 'MNG',
      'Morocco': 'MAR',
      'Mozambique': 'MOZ',
      'Myanmar': 'MMR',
      'Mexico': 'MEX',
      'Moldova': 'MDA',
      'Namibia': 'NAM',
      'Netherlands': 'NLD',
      'New Caledonia': 'NCL',
      'New Zealand': 'NZL',
      'Nicaragua': 'NIC',
      'Niger': 'NER',
      'Nigeria': 'NGA',
      'North Korea': 'PRK',
      'Norway': 'NOR',
      'Oman': 'OMN',
      'Pakistan': 'PAK',
      'Palestine': 'PSE',
      'Panama': 'PAN',
      'Papua New Guinea': 'PNG',
      'Paraguay': 'PRY',
      'Peru': 'PER',
      'Philippines': 'PHL',
      'Poland': 'POL',
      'Portugal': 'PRT',
      'Republic Of The Congo': 'COG',
      'Romania': 'ROU',
      'Russia': 'RUS',
      'Rwanda': 'RWA',
      'Réunion': 'REU',
      'Saint-Barthélemy': 'BLM',
      'Saudi Arabia': 'SAU',
      'Senegal': 'SEN',
      'Serbia': 'SRB',
      'Sierra Leone': 'SLE',
      'Slovakia': 'SVK',
      'Slovenia': 'SVN',
      'Solomon Islands': 'SLB',
      'Somalia': 'SOM',
      'South Africa': 'ZAF',
      'South Korea': 'KOR',
      'South Sudan': 'SSD',
      'Spain': 'ESP',
      'Sri Lanka': 'LKA',
      'Sudan': 'SDN',
      'Suriname': 'SUR',
      'Swaziland': 'SWZ',
      'Sweden': 'SWE',
      'Switzerland': 'CHE',
      'Syria': 'SYR',
      'São Tomé And Príncipe': 'STP',
      'Tajikistan': 'TJK',
      'Tanzania': 'TZA',
      'Thailand': 'THA',
      'Timor-Leste': 'TLS',
      'Togo': 'TGO',
      'Tunisia': 'TUN',
      'Turkey': 'TUR',
      'Turkmenistan': 'TKM',
      'Uganda': 'UGA',
      'Ukraine': 'UKR',
      'United Arab Emirates': 'ARE',
      'United Kingdom': 'GBR',
      'United States': 'USA',
      'Uruguay': 'URY',
      'Uzbekistan': 'UZB',
      'Vanuatu': 'VUT',
      'Venezuela': 'VEN',
      'Vietnam': 'VNM',
      'Virgin Islands, U.S.': 'VIR',
      'Yemen': 'YEM',
      'Zambia': 'ZMB',
      'Zimbabwe': 'ZWE',
      'Åland': 'ALA',
    };
    
    return {
      code: codeMap[name] || name.substring(0, 3).toUpperCase(),
      name
    };
  })
),

  getMapData: (year?: number) =>
    fetchGET<MapData[]>(
      '/api/map-data',
      year ? { animated: "true", year } : {} // Remove cache-busting timestamp for proper caching
    ),

  /* ---- Country required ---- */

  getLossTrend: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<LossTrendData[]>('/api/loss-trend', { country });
  },

  getPrimaryLossTrend: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<{year: number; primary_forest_loss_ha: number}[]>('/api/primary-loss-trend', { country });
  },

  getCumulativeLossTrend: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<CumulativeLossTrendData[]>('/api/cumulative-tree-cover-loss-trend', { country });
  },

  getCumulativePrimaryLossTrend: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<CumulativePrimaryLossTrendData[]>('/api/cumulative-primary-loss', { country });
  },

  getCumulativeDrivers: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<CumulativeDriversData[]>('/api/cumulative-drivers', { country });
  },

  getCumulativeTreeCoverLoss: () => {
    return fetchGET<CumulativeTreeCoverLossData[]>('/api/cumulative-tree-cover-loss');
  },

  getPrimaryLossAllCountries: (yearStart?: number, yearEnd?: number) => {
    return fetchGET<{country: string; primary_forest_loss_ha: number}[]>('/api/primary-loss-all-countries', 
      yearStart || yearEnd ? { 
        year_start: yearStart, 
        year_end: yearEnd 
      } : undefined
    );
  },

  getDrivers: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<DriversData[]>('/api/drivers', { country });
  },

  getEmissions: (country?: string) => {
    if (!country) return Promise.resolve([]);
    return fetchGET<EmissionsData[]>('/api/emissions', { country });
  },

  /* ---- Prediction (POST) ---- */
  getPrediction: (country?: string, targetYear?: number) => {
    if (!country || targetYear === undefined) {
      return Promise.reject(new Error('Country and year required'));
    }

    return fetchPOST<PredictionResponse>('/api/predict', {
      country,
      year: targetYear,
    });
  },

  getMultiCountryPrediction: (countries?: string[], targetYear?: number) => {
    if (!countries || countries.length === 0 || targetYear === undefined) {
      return Promise.reject(new Error('Countries and year required'));
    }

    return fetchPOST<MultiCountryPredictionResponse>('/api/predict', {
      countries,
      year: targetYear,
    });
  },

  /* ---- AI Recommendations ---- */
  getRecommendations: (context: {
    country: string;
    stakeholder: 'policy_governance' | 'academic_research' | 'environmental_ngo' | 'corporate_sustainability';
    dataRange: { startYear: number; endYear: number };
    includePredictions?: boolean;
    language?: string;
  }) => {
    return fetchPOST('/api/recommendations', {
      country: context.country,
      stakeholder: context.stakeholder,
      dataRange: {
        startYear: context.dataRange.startYear,
        endYear: context.dataRange.endYear,
      },
      includePredictions: context.includePredictions ? 'true' : 'false',
      language: context.language,
    });
  },

  getInsights: (request: {
    countries: string[];
    metrics: string[];
    timeframe: string;
    analysisType: 'comparative' | 'trend' | 'correlation';
  }) => {
    return fetchPOST('/api/insights', {
      countries: request.countries.join(','),
      metrics: request.metrics.join(','),
      timeframe: request.timeframe,
      analysisType: request.analysisType,
    });
  },

  getRecommendationTemplates: () => {
    return fetchGET('/api/recommendations/templates');
  },
};

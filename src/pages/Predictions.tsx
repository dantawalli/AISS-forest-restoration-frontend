import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ChartCard } from '@/components/charts/ChartCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountries, usePrediction, useMultiCountryPrediction } from '@/hooks/useForestData';
import { PredictionResponse } from '@/lib/api';
import { Sparkles, Plus, X } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

const formatHectares = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ha`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K ha`;
  return `${value} ha`;
};

interface ComparisonDataPoint {
  year: number;
  [key: string]: number | string;
}

export default function Predictions() {
  const [searchParams] = useSearchParams();
  const countryParam = searchParams.get('country');
  const { data: countries } = useCountries();
  
  // Set initial state based on URL parameter
  const getInitialCountry = () => {
    if (countryParam && countries) {
      const country = countries.find(c => c.name === countryParam);
      return country ? country.name : '';
    }
    return '';
  };
  
  const [selectedCountry, setSelectedCountry] = useState(getInitialCountry());

  // Initialize selectedCountries based on URL parameter
  const getInitialSelectedCountries = () => {
    if (countryParam && countries) {
      const country = countries.find(c => c.name === countryParam);
      return country ? [country.name] : [];
    }
    return [];
  };

  const [selectedCountries, setSelectedCountries] = useState<string[]>(getInitialSelectedCountries());
  const [targetYear, setTargetYear] = useState(2030);
  const [compareMode, setCompareMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: prediction, isLoading: predictionLoading } = usePrediction(selectedCountry, targetYear);
  const { data: multiPrediction, isLoading: multiPredictionLoading } = useMultiCountryPrediction(
    selectedCountries.filter(Boolean), targetYear
  );

  const displayCountries = countries || [];
  const selectedCountryName = selectedCountry || '';
  
  // Always use multi-country data for consistency
  const currentPrediction = selectedCountries.length === 1 && multiPrediction?.results[selectedCountry] 
    ? multiPrediction.results[selectedCountry] 
    : null;
  const currentLoading = multiPredictionLoading;
  
  // Process multi-country data for comparison
  const multiCountryData = multiPrediction?.results || {};
  
  // Use real API data for single country
  const historical = currentPrediction?.historical?.map(d => ({ 
    year: d.year, 
    value: d.tree_cover_loss_ha, 
    type: 'historical' 
  })) || [];
  
  const predictions = currentPrediction?.predictions?.map(d => ({
    year: d.year,
    predicted: d.tree_cover_loss_ha,
    upper: d.tree_cover_loss_ha * 1.1, // Add 10% uncertainty band
    lower: d.tree_cover_loss_ha * 0.9, // Add 10% uncertainty band
    type: 'prediction',
  })) || [];
  
  // Handle edge cases where historical data might be empty
  const lastHistoricalValue = historical.length > 0 ? historical[historical.length - 1]?.value : 0;
  
  const chartData = [
    ...historical.map(d => ({ ...d, predicted: null, upper: null, lower: null })),
    // Bridge point - only add if we have historical data
    ...(historical.length > 0 ? [{
      year: prediction?.last_year || 2024, 
      value: lastHistoricalValue,
      predicted: lastHistoricalValue,
      upper: lastHistoricalValue,
      lower: lastHistoricalValue,
      type: 'bridge'
    }] : []),
    ...predictions.map(d => ({ ...d, value: null })),
  ];

  const targetPrediction = currentPrediction?.target_prediction;
  const historicalAvg = currentPrediction?.avg_historical || 0;
  const changePercent = currentPrediction?.change_pct?.toFixed(1) || '0';
  const isIncrease = Number(changePercent) > 0;

  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  // Filter countries based on search term
  const filteredCountries = displayCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle country selection for comparison
  const handleCountryToggle = (countryName: string) => {
    if (selectedCountries.includes(countryName)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter(c => c !== countryName));
      }
    } else {
      setSelectedCountries([...selectedCountries, countryName]);
    }
    // Update selected country to the first selected
    setSelectedCountry(selectedCountries.filter(c => c !== countryName).length > 0 ? 
      selectedCountries.filter(c => c !== countryName)[0] : countryName);
  };

  // Generate comparison data for multiple countries
  const generateComparisonData = (): ComparisonDataPoint[] => {
    const comparisonData: ComparisonDataPoint[] = [];
    const allYears = new Set<number>();
    
    // Collect all years from all countries
    selectedCountries.forEach(countryName => {
      if (multiCountryData[countryName]) {
        const countryData = multiCountryData[countryName];
        countryData.historical.forEach((d: { year: number; tree_cover_loss_ha: number }) => allYears.add(d.year));
        countryData.predictions.forEach((d: { year: number; tree_cover_loss_ha: number }) => allYears.add(d.year));
      }
    });
    
    // Generate data points for each year
    Array.from(allYears).sort((a, b) => a - b).forEach(year => {
      const dataPoint: ComparisonDataPoint = { year };
      
      selectedCountries.forEach((countryName, index) => {
        if (multiCountryData[countryName]) {
          const countryData = multiCountryData[countryName];
          
          // Check historical data first
          const histValue = countryData.historical.find((d: { year: number; tree_cover_loss_ha: number }) => d.year === year)?.tree_cover_loss_ha;
          // Then check predictions
          const predValue = countryData.predictions.find((d: { year: number; tree_cover_loss_ha: number }) => d.year === year)?.tree_cover_loss_ha;
          
          dataPoint[`country_${countryName}`] = predValue || histValue || 0;
          dataPoint[`country_${countryName}_type`] = predValue ? 'prediction' : 'historical';
        }
      });
      
      comparisonData.push(dataPoint);
    });
    
    return comparisonData;
  };

  const comparisonData = generateComparisonData();
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d4a5a5'];

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary" />
          Predictions & Forecasting
        </h1>
        <p className="text-muted-foreground text-lg">
          Machine learning predictions for future deforestation trends
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-xl p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Countries
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Select open={isOpen} onOpenChange={setIsOpen}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select countries..." />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        {/* Search Input */}
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {/* Country List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCountries.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              No countries found
                            </div>
                          ) : (
                            filteredCountries.map((country) => (
                              <div 
                                key={country.name} 
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                                onClick={() => handleCountryToggle(country.name)}
                              >
                                <Checkbox
                                  checked={selectedCountries.includes(country.name)}
                                  onCheckedChange={() => handleCountryToggle(country.name)}
                                />
                                <span className="text-sm select-none">{country.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Selected Countries with Colors */}
                {selectedCountries.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCountries.map((countryName, index) => {
                      return (
                        <div key={countryName} className="flex items-center gap-1 px-2 py-1 rounded-full border text-xs">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <span>{countryName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Target Year
              </label>
              <Select value={String(targetYear)} onValueChange={(v) => setTargetYear(Number(v))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction Chart */}
      <ChartCard
        title={selectedCountries.length === 0 ? 'Select Country and Year' : 
               selectedCountries.length === 1 ? `Forecast - ${selectedCountryName}` : 'Country Comparison'}
        subtitle={selectedCountries.length === 0 ? 'Choose a country and target year to see predictions' :
                 selectedCountries.length === 1 ? 'Historical data (solid) vs ML predictions (dashed)' : 'Compare multiple countries predictions'}
      >
        {selectedCountries.length === 0 ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Selection Made</h3>
              <p className="text-muted-foreground mb-4">
                Please select at least one country and a target year to view predictions.
              </p>
              <div className="flex gap-2 justify-center">
                <div className="text-sm bg-muted px-3 py-1 rounded">
                  🌍 Select Country
                </div>
                <div className="text-sm bg-muted px-3 py-1 rounded">
                  📅 Select Year
                </div>
              </div>
            </div>
          </div>
        ) : currentLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={comparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200 70% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(200 70% 50%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  return `${(value / 1000).toFixed(0)}K`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  boxShadow: 'var(--shadow-card)',
                  padding: '12px 16px',
                }}
                formatter={(value: number, name: string) => {
                  if (!value) return [null, null];
                  const countryName = name.replace('country_', '').replace('_type', '');
                  return [formatHectares(value), countryName];
                }}
                labelFormatter={(label) => `Year: ${label}`}
              />
              
              {/* Country lines - always use multi-country format */}
              {selectedCountries.map((countryName, index) => (
                <Line
                  key={countryName}
                  type="monotone"
                  dataKey={`country_${countryName}`}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray={index === 0 ? '0' : '4 2'}
                />
              ))}
              
              {/* Reference line at current year */}
              <ReferenceLine
                x={prediction?.last_year || 2024}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                label={{
                  value: 'Now',
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
          {selectedCountries.map((countryName, index) => (
            <div key={countryName} className="flex items-center gap-2">
              <div className="w-8 h-1 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="text-sm text-muted-foreground">
                {countryName}
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </PageLayout>
  );
}

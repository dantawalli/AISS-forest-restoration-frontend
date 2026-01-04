import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { 
  Brain, 
  Download, 
  Share2, 
  MapPin, 
  CheckSquare, 
  Clock, 
  DollarSign, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Search
} from 'lucide-react';
import { useRecommendations, useRecommendationTemplates, useInvalidateRecommendations } from '@/hooks/useRecommendations';
import { RecommendationContext, StakeholderType } from '@/types/recommendations';
import { PageLayout } from '@/components/layout/PageLayout';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import RecommendationFormatter from '@/components/RecommendationFormatter';
import './Recommendations.css';

const Recommendations: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderType>('policy_governance');
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useRecommendationTemplates();
  const { data: countriesData, isLoading: countriesLoading } = useQuery({
    queryKey: ['countries'],
    queryFn: () => api.getCountries(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const countries = useMemo(() => countriesData?.map(country => country.name) || [], [countriesData]);
  
  const stakeholderOptions = useMemo(() => [
    { value: 'policy_governance', label: 'Policy & Governance' },
    { value: 'academic_research', label: 'Academic & Research' },
    { value: 'environmental_ngo', label: 'Environmental NGO' },
    { value: 'corporate_sustainability', label: 'Corporate Sustainability' }
  ], []);
  
  // Filter countries based on search
  const filteredCountries = useMemo(() => countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  ), [countries, countrySearch]);

  const { data: recommendations, isLoading, error, refetch } = useRecommendations({
    country: selectedCountry,
    stakeholder: selectedStakeholder,
    dataRange: { startYear: 2001, endYear: 2024 },
    includePredictions: true
  } as RecommendationContext, {
    enabled: false // Disable automatic fetching
  });

  const { invalidateRecommendations } = useInvalidateRecommendations();

  const getStakeholderName = (stakeholder: StakeholderType) => {
    const option = stakeholderOptions.find(opt => opt.value === stakeholder);
    return option?.label || stakeholder;
  };

  const exportPDF = async () => {
    if (!recommendations?.data) return;
    
    // Simple PDF export simulation
    const content = `
AI Recommendations - ${recommendations.data.country}
Stakeholder: ${getStakeholderName(recommendations.data.stakeholder)}
Generated: ${new Date(recommendations.data.generatedAt).toLocaleDateString()}

${recommendations.data.summary}

Recommendations:
${recommendations.data.recommendations?.map((rec, index) => `
${rec.recommendation_number}. ${rec.title}

${rec.text}
`).join('\n')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-${recommendations.data.country}-${recommendations.data.stakeholder}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Recommendations exported successfully!');
  };

  const shareReport = async () => {
    if (!recommendations?.data) return;
    
    const shareUrl = `${window.location.origin}/recommendations?country=${selectedCountry}&stakeholder=${selectedStakeholder}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const generateRecommendations = useCallback(() => {
    if (!selectedCountry) {
      toast.error('Please select a country');
      return;
    }
    refetch();
  }, [selectedCountry, refetch]);

  // Handle URL parameters for auto-selection and search
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryParam = urlParams.get('country');
    const stakeholderParam = urlParams.get('stakeholder') as StakeholderType;

    // Set country if parameter exists and country is valid
    if (countryParam && countries.includes(countryParam)) {
      setSelectedCountry(countryParam);
    }

    // Set stakeholder if parameter exists and is valid
    if (stakeholderParam && stakeholderOptions.some(option => option.value === stakeholderParam)) {
      setSelectedStakeholder(stakeholderParam);
    }

    // Auto-start search only if both parameters are present and valid
    if (countryParam && stakeholderParam && 
        countries.includes(countryParam) && 
        stakeholderOptions.some(option => option.value === stakeholderParam)) {
      // Small delay to ensure state is set
      setTimeout(() => {
        generateRecommendations();
      }, 100);
    }
  }, [countries, stakeholderOptions, generateRecommendations]); // Re-run when countries data is loaded

  if (error) {
    const isTimeout = (error as Error)?.message?.includes('504') || 
                    (error as Error)?.message?.includes('Gateway Timeout') ||
                    (error as Error)?.message?.includes('LLM_UNAVAILABLE');
    
    return (
      <PageLayout>
        <div className="container mx-auto py-8">
          <Card className="border-red-200 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isTimeout ? 'AI Service Unavailable' : 'Unable to Generate Recommendations'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isTimeout 
                    ? 'The AI service is currently experiencing high demand. Please try again in a few moments.'
                    : (error as Error)?.message || 'An error occurred while generating recommendations'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={generateRecommendations}>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Try Again
                  </Button>
                  {isTimeout && (
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Refresh Page
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI-Powered Recommendations
            </h1>
            <p className="text-muted-foreground mt-2">
              Get actionable insights based on forest data analysis and predictions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPDF} disabled={!recommendations?.data}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={shareReport} disabled={!recommendations?.data}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between", !selectedCountry && "text-muted-foreground")}
                      disabled={countriesLoading}
                    >
                      {selectedCountry || "Select country"}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search countries..."
                        value={countrySearch}
                        onValueChange={setCountrySearch}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>
                          {countriesLoading ? "Loading countries..." : "No countries found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCountries.map((country) => (
                            <CommandItem
                              key={country}
                              value={country}
                              onSelect={(currentValue) => {
                                setSelectedCountry(currentValue);
                                setCountrySearch('');
                                setIsCountryOpen(false);
                              }}
                            >
                              {country}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {countries.length === 0 && !countriesLoading && (
                  <p className="text-xs text-red-500 mt-1">No countries available</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="stakeholder">Stakeholder Group</Label>
                <Select value={selectedStakeholder} onValueChange={(value: StakeholderType) => setSelectedStakeholder(value)}>
                  <SelectTrigger id="stakeholder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholderOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={generateRecommendations} 
              disabled={!selectedCountry || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Brain className="h-12 w-12 animate-pulse text-primary mb-4" />
                <h3 className="text-lg font-semibold">Generating AI Recommendations</h3>
                <p className="text-muted-foreground mb-2">
                  Analyzing forest data and creating insights...
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  This may take 30-60 seconds as the AI processes historical data and generates stakeholder-specific recommendations.
                </p>
                <div className="w-64 bg-muted rounded-full h-2 mt-4">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Checking status...
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Display */}
        {recommendations?.data && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {recommendations.data.country} - {getStakeholderName(recommendations.data.stakeholder)}
                  </CardTitle>
                  <CardDescription>
                    Generated {new Date(recommendations.data.generatedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* AI Response Display */}
              <div className="space-y-6">
                {/* Summary */}
                {recommendations.data.summary && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Executive Summary</h3>
                        <p className="text-xs text-blue-600">AI Analysis</p>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed">{recommendations.data.summary}</p>
                    </div>
                  </div>
                )}

                {/* Recommendations - Chatbot Style */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Recommendations</h3>
                      <p className="text-xs text-gray-600">Actionable Insights</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {recommendations.data.recommendations?.map((rec, index) => (
                      <div key={index} className={`p-6 ${index !== recommendations.data.recommendations.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-semibold text-gray-900 text-lg">Recommendation {index + 1}</h4>
                            </div>
                            
                            <RecommendationFormatter 
                              text={rec.text} 
                              recommendationNumber={index + 1} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default Recommendations;

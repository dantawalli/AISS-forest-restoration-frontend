import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCountries, useLossTrend, useEmissions, useDrivers } from '@/hooks/useForestData';
import { api } from '@/lib/api';
import { TreePine, Flame, Search, Globe, Brain, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';

export default function CountryExplorer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle country parameter from URL
  useEffect(() => {
    const countryParam = searchParams.get('country');
    if (countryParam) {
      setSelectedCountry(decodeURIComponent(countryParam));
    }
  }, [searchParams]);

  const { data: countries } = useCountries();
  const { data: lossTrend, isLoading: trendLoading } = useLossTrend(selectedCountry);
  const { data: emissions, isLoading: emissionsLoading } = useEmissions(selectedCountry);
  const { data: drivers, isLoading: driversLoading } = useDrivers(selectedCountry);
  const [primaryLossTrend, setPrimaryLossTrend] = useState([]);
  const [primaryLoading, setPrimaryLoading] = useState(false);

  // Fetch primary forest loss data when country changes
  useEffect(() => {
    if (selectedCountry) {
      const fetchPrimaryLoss = async () => {
        setPrimaryLoading(true);
        try {
          const data = await api.getPrimaryLossTrend(selectedCountry);
          const formattedData = data.map(d => ({ year: d.year, value: d.primary_forest_loss_ha }));
          setPrimaryLossTrend(formattedData);
        } catch (error) {
          console.error('Error fetching primary loss data:', error);
          setPrimaryLossTrend([]);
        } finally {
          setPrimaryLoading(false);
        }
      };
      fetchPrimaryLoss();
    } else {
      setPrimaryLossTrend([]);
    }
  }, [selectedCountry]);

  const displayCountries = countries || [];
  const filteredCountries = displayCountries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayTrend = lossTrend?.map(d => ({ year: d.year, value: d.tree_cover_loss_ha })) || [];
  const displayEmissions = emissions?.map(d => ({ year: d.year, value: d.carbon_gross_emissions_MgCO2e })) || [];
  const displayDrivers = drivers?.map(d => ({ name: d.driver, value: Math.round((d.hectares / drivers.reduce((sum, item) => sum + item.hectares, 0)) * 100) })) || [];

  const selectedCountryName = displayCountries.find(c => c.name === selectedCountry)?.name || 'Select Country';

  const totalLoss = displayTrend.reduce((sum, d) => sum + d.value, 0);
  const avgLoss = displayTrend.length > 0 ? totalLoss / displayTrend.length : 0;

  const formatHectares = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ha`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ha`;
    return `${value} ha`;
  };

  const formatEmissions = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    return value.toLocaleString();
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Country Explorer
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore detailed deforestation data by country
            </p>
          </div>
          <div className="flex gap-2">
            {selectedCountry ? (
              <>
                <button
                  onClick={() => navigate(`/predictions?country=${encodeURIComponent(selectedCountry)}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <TrendingUp className="h-4 w-4" />
                  AI Predictions for {selectedCountry}
                </button>
                <button
                  onClick={() => navigate(`/recommendations?country=${encodeURIComponent(selectedCountry)}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Brain className="h-4 w-4" />
                  AI Recommendations for {selectedCountry}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Country Selector */}
      <div className="mb-8">
        <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Select Country
            </label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Choose a country" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {filteredCountries.map((country) => (
                  <SelectItem key={country.name} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatHectares(avgLoss)}</p>
              <p className="text-xs text-muted-foreground">Avg. Annual Loss</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{displayTrend.length}</p>
              <p className="text-xs text-muted-foreground">Years of Data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Total Tree Cover Loss"
          value={formatHectares(totalLoss)}
          subtitle={`${selectedCountryName} - All years`}
          icon={TreePine}
          variant="forest"
        />
        <StatCard
          title="Total Carbon Emissions"
          value={formatEmissions(displayEmissions.reduce((sum, d) => sum + d.value, 0))}
          subtitle="MgCO₂e released"
          icon={Flame}
          variant="amber"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title={`Tree Cover Loss Trend - ${selectedCountryName || 'Select Country'}`}
          subtitle="Annual hectares lost"
        >
          {trendLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <AreaTrendChart
              data={displayTrend}
              color="forest"
              formatValue={formatHectares}
            />
          )}
        </ChartCard>

        <ChartCard
          title={`Primary Forest Loss Trend - ${selectedCountryName || 'Select Country'}`}
          subtitle="Primary forest hectares lost"
        >
          {primaryLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : primaryLossTrend.length === 0 || primaryLossTrend.every(d => d.value === 0) ? (
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
              No primary forest data for this country
            </div>
          ) : (
            <AreaTrendChart
              data={primaryLossTrend}
              color="terracotta"
              formatValue={formatHectares}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartCard
          title="Deforestation Drivers"
          subtitle={`${selectedCountryName} breakdown`}
        >
          {driversLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <>
              <DonutChart
                data={displayDrivers}
                centerValue={`${displayDrivers[0]?.value || 0}%`}
                centerLabel={displayDrivers[0]?.name || ''}
              />
              <DonutLegend data={displayDrivers} />
            </>
          )}
        </ChartCard>

        <ChartCard
          title={`Carbon Emissions - ${selectedCountryName}`}
          subtitle="Annual MgCO₂e released"
        >
          {emissionsLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <AreaTrendChart
              data={displayEmissions}
              color="terracotta"
              height={250}
              formatValue={(v) => `${formatEmissions(v)} MgCO₂e`}
            />
          )}
        </ChartCard>
      </div>

      {/* Data Table */}
      <ChartCard title="Yearly Data" subtitle="Detailed breakdown by year">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Tree Cover Loss</TableHead>
                <TableHead>Carbon Emissions</TableHead>
                <TableHead>Primary Driver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayTrend.map((row, index) => {
                const yearData = displayEmissions.find(e => e.year === row.year);
                const primaryDriver = displayDrivers.find(d => d.name === (drivers?.find(dr => dr.hectares === Math.max(...drivers.map(dr => dr.hectares)))?.driver || ''))?.name || '';
                return (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell>{formatHectares(row.value)}</TableCell>
                    <TableCell>{yearData ? formatEmissions(yearData.value) : 'N/A'} MgCO₂e</TableCell>
                    <TableCell>{primaryDriver}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </PageLayout>
  );
}

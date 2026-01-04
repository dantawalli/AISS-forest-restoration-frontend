import { PageLayout } from '@/components/layout/PageLayout';
import { StatCard } from '@/components/ui/stat-card';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart';
import { BarChartHorizontal } from '@/components/charts/BarChartHorizontal';
import { TreePine, Globe, Flame, Calendar } from 'lucide-react';
import { useSummary, useLossTrend, useDrivers } from '@/hooks/useForestData';
import { useGlobalLossTrend, useGlobalDrivers } from '@/hooks/useGlobalData';
import { Skeleton } from '@/components/ui/skeleton';

// Demo data for preview when API is not connected
const demoSummary = {
  total_countries: 186,
  total_loss_hectares: 425000000,
  total_emissions: 12500000000,
  latest_year: 2023,
  earliest_year: 2001,
};

const demoLossTrend = [
  { year: 2015, value: 18500000 },
  { year: 2016, value: 21200000 },
  { year: 2017, value: 23100000 },
  { year: 2018, value: 19800000 },
  { year: 2019, value: 22400000 },
  { year: 2020, value: 25800000 },
  { year: 2021, value: 24100000 },
  { year: 2022, value: 26900000 },
  { year: 2023, value: 28200000 },
];

const demoTopCountries = [
  { name: 'Brazil', value: 1500000 },
  { name: 'Indonesia', value: 824000 },
  { name: 'DRC', value: 620000 },
  { name: 'Bolivia', value: 290000 },
  { name: 'Peru', value: 185000 },
];

const demoDrivers = [
  { name: 'Agriculture', value: 45 },
  { name: 'Logging', value: 25 },
  { name: 'Wildfire', value: 15 },
  { name: 'Infrastructure', value: 10 },
  { name: 'Other', value: 5 },
];

// Use demo data if API is not connected

export default function OverviewDashboard() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { data: globalLossTrend, isLoading: globalTrendLoading } = useGlobalLossTrend();
  const { data: globalDrivers, isLoading: globalDriversLoading } = useGlobalDrivers();

  const normalizedSummary = summary
    ? {
      total_countries: summary.countries,
      total_loss_hectares: summary.total_loss,
      total_emissions: summary.total_emissions,
      latest_year: summary.latest_year,
      earliest_year: 2001, // fixed baseline
    }
    : null;

  const displaySummary = normalizedSummary || demoSummary;
  const displayTrend = globalLossTrend ? globalLossTrend.map(d => ({ year: d.year, value: d.tree_cover_loss_ha })) : demoLossTrend;
  const displayDrivers = globalDrivers?.map(d => ({ name: d.driver, value: d.percentage })) || demoDrivers;
  const formatHectares = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ha`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ha`;
    return `${value} ha`;
  };

  const formatEmissions = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    return value.toLocaleString();
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Global Forest Watch
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor worldwide tree cover loss, carbon emissions, and deforestation trends
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <StatCard
              title="Countries Tracked"
              value={displaySummary.total_countries}
              subtitle="Worldwide coverage"
              icon={Globe}
              variant="forest"
            />
            <StatCard
              title="Tree Cover Loss"
              value={formatHectares(displaySummary.total_loss_hectares)}
              subtitle="Total since 2001"
              icon={TreePine}
            />
            <StatCard
              title="Carbon Emissions"
              value={formatEmissions(displaySummary.total_emissions)}
              subtitle="MgCO₂e released"
              icon={Flame}
              variant="amber"
            />
            <StatCard
              title="Latest Data"
              value={displaySummary.latest_year}
              subtitle={`From ${displaySummary.earliest_year}`}
              icon={Calendar}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Global Tree Cover Loss Trend"
            subtitle="Annual hectares lost worldwide"
          >
            {globalTrendLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <AreaTrendChart
                data={displayTrend}
                color="forest"
                formatValue={formatHectares}
              />
            )}
          </ChartCard>
        </div>

        {/* Drivers Donut */}
        <ChartCard
          title="Deforestation Drivers"
          subtitle="Primary causes globally"
        >
          {globalDriversLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <>
              <DonutChart
                data={displayDrivers}
                centerValue={`${displayDrivers[0]?.value || 0}%`}
                centerLabel="Agriculture"
              />
              <DonutLegend data={displayDrivers} />
            </>
          )}
        </ChartCard>

        {/* Top Countries Bar Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Top Countries by Tree Loss"
            subtitle="Highest deforestation in 2023"
          >
            <BarChartHorizontal
              data={demoTopCountries}
              color="forest"
              formatValue={formatHectares}
            />
          </ChartCard>
        </div>

        {/* Quick Stats */}
        <ChartCard title="Quick Insights">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Highest loss year</span>
              <span className="font-semibold text-foreground">2023</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">5-year trend</span>
              <span className="font-semibold text-chart-terracotta">+12.4%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Most affected region</span>
              <span className="font-semibold text-foreground">South America</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Primary driver</span>
              <span className="font-semibold text-foreground">Agriculture</span>
            </div>
          </div>
        </ChartCard>
      </div>
    </PageLayout>
  );
}

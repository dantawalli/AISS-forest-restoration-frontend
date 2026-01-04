import { useQuery } from '@tanstack/react-query';
import { api, LossTrendData, DriversData, CumulativeTreeCoverLossData } from '@/lib/api';

export function useGlobalLossTrend() {
  return useQuery({
    queryKey: ['global-loss-trend'],
    queryFn: async () => {
      // Get top countries with significant forest loss
      const countries = ['Brazil', 'Indonesia', 'Democratic Republic of Congo', 'Bolivia', 'Peru'];
      
      try {
        const promises = countries.map(country => api.getLossTrend(country));
        const results = await Promise.allSettled(promises);
        
        // Aggregate data by year
        const yearlyData: { [year: number]: number } = {};
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            result.value.forEach((item: LossTrendData) => {
              if (item.year && item.tree_cover_loss_ha) {
                yearlyData[item.year] = (yearlyData[item.year] || 0) + item.tree_cover_loss_ha;
              }
            });
          }
        });
        
        // Convert to array format and sort by year
        return Object.entries(yearlyData)
          .map(([year, value]) => ({
            year: parseInt(year),
            tree_cover_loss_ha: value
          }))
          .sort((a, b) => a.year - b.year);
      } catch (error) {
        console.error('Error fetching global loss trend:', error);
        return [];
      }
    },
  });
}

export function useGlobalDrivers() {
  return useQuery({
    queryKey: ['global-drivers'],
    queryFn: async () => {
      try {
        // Use the new cumulative tree cover loss endpoint to get all countries
        const countriesData = await api.getCumulativeTreeCoverLoss();
        
        if (!Array.isArray(countriesData)) {
          return [];
        }
        
        // Get drivers for top 10 countries by cumulative loss
        const topCountries = countriesData
          .sort((a, b) => b.cumulative_tree_cover_loss_ha - a.cumulative_tree_cover_loss_ha)
          .slice(0, 10)
          .map(c => c.country);
        
        const promises = topCountries.map(country => api.getDrivers(country));
        const results = await Promise.allSettled(promises);
        
        // Aggregate driver data
        const driverData: { [driver: string]: number } = {};
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
            result.value.forEach((item: DriversData) => {
              if (item.driver && item.hectares) {
                driverData[item.driver] = (driverData[item.driver] || 0) + item.hectares;
              }
            });
          }
        });
        
        // Calculate percentages and convert to array format
        const total = Object.values(driverData).reduce((sum, val) => sum + val, 0);
        
        return Object.entries(driverData)
          .map(([driver, value]) => ({
            driver,
            percentage: Math.round((value / total) * 100)
          }))
          .sort((a, b) => b.percentage - a.percentage);
      } catch (error) {
        console.error('Error fetching global drivers:', error);
        return [];
      }
    },
  });
}

export function useTopCountriesByPrimaryLoss() {
  return useQuery({
    queryKey: ['top-countries-primary-loss'],
    queryFn: async () => {
      try {
        const countries = await api.getCountries();
        const lossData: { country: string; primary_loss: number }[] = [];
        
        for (const country of countries.slice(0, 20)) { // Get top 20 countries
          try {
            const trendData = await api.getCumulativePrimaryLossTrend(country.name);
            if (Array.isArray(trendData) && trendData.length > 0) {
              // Get the most recent year's cumulative data
              const latestYear = Math.max(...trendData.map(d => d.year));
              const latestData = trendData.find(d => d.year === latestYear);
              
              if (latestData && latestData.cumulative_primary_forest_loss_ha > 0) {
                lossData.push({
                  country: country.name,
                  primary_loss: latestData.cumulative_primary_forest_loss_ha
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch primary data for ${country.name}:`, error);
          }
        }
        
        return lossData
          .sort((a, b) => b.primary_loss - a.primary_loss)
          .slice(0, 10); // Return top 10
      } catch (error) {
        console.error('Error fetching top countries by primary loss:', error);
        return [];
      }
    },
  });
}

export function useTopCountriesByTotalLoss() {
  return useQuery({
    queryKey: ['top-countries-total-loss'],
    queryFn: async () => {
      try {
        // Use the new cumulative tree cover loss endpoint
        const countriesData = await api.getCumulativeTreeCoverLoss();
        
        if (!Array.isArray(countriesData)) {
          return [];
        }
        
        return countriesData
          .sort((a, b) => b.cumulative_tree_cover_loss_ha - a.cumulative_tree_cover_loss_ha)
          .slice(0, 10) // Return top 10
          .map(country => ({
            country: country.country,
            total_loss: Math.round(country.cumulative_tree_cover_loss_ha)
          }));
      } catch (error) {
        console.error('Error fetching top countries by total loss:', error);
        return [];
      }
    },
  });
}

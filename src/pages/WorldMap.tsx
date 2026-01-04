import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { PageLayout } from '@/components/layout/PageLayout';
import { ChartCard } from '@/components/charts/ChartCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, FastForward, Rewind } from 'lucide-react';
import { useMapData, usePrimaryMapData } from '@/hooks/useForestData';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MapData } from '@/lib/api';
import { api } from '@/lib/api';
import { useEffect, useRef } from 'react';
import './WorldMap.css';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const getColor = (value: number | undefined, maxValue: number, colorMode: 'loss' | 'intensity' | 'hotspot' = 'loss'): string => {
  if (!value || value === 0) return '#ffffff'; // White for zero loss
  const intensity = Math.min(value / maxValue, 1);
  
  switch (colorMode) {
    case 'intensity':
      // Blue gradient for intensity
      if (intensity < 0.2) return 'hsl(200 50% 90%)';
      if (intensity < 0.4) return 'hsl(200 60% 70%)';
      if (intensity < 0.6) return 'hsl(200 70% 50%)';
      if (intensity < 0.8) return 'hsl(200 80% 30%)';
      return 'hsl(200 90% 20%)';
    
    case 'hotspot':
      // Red-orange gradient for hotspots
      if (intensity < 0.2) return 'hsl(45 50% 85%)';
      if (intensity < 0.4) return 'hsl(30 70% 65%)';
      if (intensity < 0.6) return 'hsl(15 80% 55%)';
      if (intensity < 0.8) return 'hsl(5 90% 45%)';
      return 'hsl(0 95% 35%)';
    
    default: // loss
      // From light green to dark red
      if (intensity < 0.2) return 'hsl(142 50% 80%)';
      if (intensity < 0.4) return 'hsl(80 50% 60%)';
      if (intensity < 0.6) return 'hsl(45 70% 55%)';
      if (intensity < 0.8) return 'hsl(25 80% 50%)';
      return 'hsl(0 70% 45%)';
  }
};

const getHeatmapColor = (value: number | undefined, maxValue: number): string => {
  if (!value || value === 0) return '#ffffff'; // White for zero loss
  const intensity = Math.min(value / maxValue, 1);
  
  // Heat map colors: blue -> green -> yellow -> red
  if (intensity < 0.25) return `hsl(240 70% ${30 + intensity * 4 * 40}%)`;
  if (intensity < 0.5) return `hsl(${240 - (intensity - 0.25) * 4 * 120} 70% 70%)`;
  if (intensity < 0.75) return `hsl(${60 - (intensity - 0.5) * 4 * 60} 70% 70%)`;
  return `hsl(0 70% ${70 - (intensity - 0.75) * 4 * 40}%)`;
};

const formatHectares = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ha`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K ha`;
  return `${value} ha`;
};

const MapChart = memo(({ 
  year, 
  zoom, 
  center,
  onZoomEnd,
  mapData,
  dataType,
  colorMode,
  onCountryClick,
}: { 
  year: number; 
  zoom: number; 
  center: [number, number];
  onZoomEnd: (e: { zoom: number; coordinates: [number, number] }) => void;
  mapData: MapData[];
  dataType: 'tree-cover' | 'primary-forest';
  colorMode: 'loss' | 'intensity' | 'hotspot' | 'heatmap';
  onCountryClick: (country: string) => void;
}) => {
  const [tooltipContent, setTooltipContent] = useState<{ name: string; value: number } | null>(null);
  
  // Calculate max value from real data for color scaling
  const maxValue = mapData && mapData.length > 0 
    ? Math.max(...mapData.map(d => d.tree_cover_loss_ha || 0))
    : 3000000;

  return (
    <div className="relative w-full h-full p-0 m-0" style={{ backgroundColor: '#e6f3ff' }}> {/* Ocean blue background */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          rotate: [0, 0, 0],
          center: [0, 0],
          clipAngle: 90,  // Hide Antarctica (below -60 degrees)
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={onZoomEnd}
          minZoom={0.5}
          maxZoom={8}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Try multiple possible country name properties
                const geoCountryName = geo.properties?.NAME || 
                  geo.properties?.name || 
                  geo.properties?.ADMIN ||
                  geo.properties?.SOV0NAME ||
                  geo.properties?.SOV_A3 ||
                  geo.properties?.ISO_A3 ||
                  geo.properties?.formal_en ||
                  geo.properties?.name_long ||
                  geo.properties?.name;

                // Create mapping for exact country name matches
                const countryNameMapping: { [key: string]: string } = {
                  // Geography name -> Data name mapping
                  'United States of America': 'United States',
                  'USA': 'United States',
                  'United States': 'United States',
                  'Czech Republic': 'Czechia',
                  'Czechia': 'Czechia',
                  "Côte d'Ivoire": "Côte d'Ivoire",
                  'Ivory Coast': 'Côte d\'Ivoire',
                  'Democratic Republic of the Congo': 'Democratic Republic Of The Congo',
                  'DR Congo': 'Democratic Republic Of The Congo',
                  'Dem. Rep. Congo': 'Democratic Republic Of The Congo', // Map has abbreviated, API has full name
                  'Congo (Kinshasa)': 'Democratic Republic Of The Congo',
                  'Republic of the Congo': 'Republic Of The Congo',
                  'Congo': 'Republic Of The Congo', // Map has shortened, API has full name
                  'Congo (Brazzaville)': 'Republic Of The Congo',
                  'Myanmar (Burma)': 'Myanmar',
                  'Burma': 'Myanmar',
                  'South Korea': 'South Korea',
                  'Korea (South)': 'South Korea',
                  'North Korea': 'North Korea',
                  'Korea (North)': 'North Korea',
                  'Somaliland': 'Somalia', // Map has Somaliland, API has Somalia
                  'S. Sudan': 'South Sudan', // Map has S. Sudan, API has South Sudan
                  'Sao Tome and Principe': 'São Tomé And Príncipe',
                  'Saint Kitts and Nevis': 'Saint Kitts and Nevis',
                  'St. Kitts and Nevis': 'Saint Kitts and Nevis',
                  'Saint Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
                  'St. Vincent and the Grenadines': 'Saint Vincent and the Grenadines',
                  'Saint Lucia': 'Saint Lucia',
                  'St. Lucia': 'Saint Lucia',
                  'Dominican Republic': 'Dominican Republic',
                  'Dominican Rep.': 'Dominican Republic',
                  'Antigua and Barbuda': 'Antigua and Barbuda',
                  'Antigua & Barbuda': 'Antigua and Barbuda',
                  'Trinidad and Tobago': 'Trinidad and Tobago',
                  'Trinidad & Tobago': 'Trinidad and Tobago',
                  'Papua New Guinea': 'Papua New Guinea',
                  'New Caledonia': 'New Caledonia',
                  'French Guiana': 'French Guiana',
                  'Guadeloupe': 'Guadeloupe',
                  'Martinique': 'Martinique',
                  'Réunion': 'Réunion',
                  'Reunion': 'Réunion',
                  'Saint-Barthélemy': 'Saint-Barthélemy',
                  'Faroe Islands': 'Faroe Islands',
                  'Micronesia': 'Micronesia',
                  'Federated States of Micronesia': 'Micronesia',
                  'Solomon Islands': 'Solomon Islands',
                  'Vanuatu': 'Vanuatu',
                  'Fiji': 'Fiji',
                  'Kiribati': 'Kiribati',
                  'Marshall Islands': 'Marshall Islands',
                  'Palau': 'Palau',
                  'Nauru': 'Nauru',
                  'Tuvalu': 'Tuvalu',
                  'Samoa': 'Samoa',
                  'Tonga': 'Tonga',
                  'Cook Islands': 'Cook Islands',
                  'Niue': 'Niue',
                  'Tokelau': 'Tokelau',
                  'American Samoa': 'American Samoa',
                  'Guam': 'Guam',
                  'Northern Mariana Islands': 'Northern Mariana Islands',
                  'U.S. Virgin Islands': 'Virgin Islands, U.S.',
                  'Virgin Islands': 'Virgin Islands, U.S.',
                  'British Virgin Islands': 'British Virgin Islands',
                  'Anguilla': 'Anguilla',
                  'Montserrat': 'Montserrat',
                  'Turks and Caicos Islands': 'Turks and Caicos Islands',
                  'Cayman Islands': 'Cayman Islands',
                  'Bermuda': 'Bermuda',
                  'Greenland': 'Greenland',
                  'Saint Pierre and Miquelon': 'Saint Pierre and Miquelon',
                  'Aruba': 'Aruba',
                  'Curaçao': 'Curaçao',
                  'Curacao': 'Curaçao',
                  'Sint Maarten': 'Sint Maarten',
                  'Bonaire': 'Bonaire',
                  'Easter Island': 'Easter Island',
                  'Galápagos Islands': 'Galápagos Islands',
                  'Juan Fernández Islands': 'Juan Fernández Islands',
                  'Isle of Man': 'Isle of Man',
                  'Channel Islands': 'Channel Islands',
                  'Jersey': 'Jersey',
                  'Guernsey': 'Guernsey',
                  'Åland Islands': 'Åland',
                  'Aland': 'Åland',
                  'Svalbard': 'Svalbard',
                  'Jan Mayen': 'Jan Mayen',
                  'Western Sahara': 'Western Sahara',
                  'Palestine': 'Palestine',
                  'Kosovo': 'Kosovo',
                  'Taiwan': 'Taiwan',
                  'Hong Kong': 'Hong Kong',
                  'Macau': 'Macau',
                  'Macao': 'Macau',
                  'Moldova': 'Moldova',
                  'Singapore': 'Singapore',
                  'Brunei': 'Brunei',
                  'East Timor': 'Timor-Leste',
                  'Timor Leste': 'Timor-Leste',
                  'Central African Rep.': 'Central African Republic', // Map has abbreviated, API has full name
                  // Additional common variations
                  'Moldova, Republic of': 'Moldova',
                  'Republic of Moldova': 'Moldova',
                  'Cote d\'Ivoire': "Côte d'Ivoire",
                  'Cote dIvoire': "Côte d'Ivoire",
                  "Côte D'Ivoire": "Côte d'Ivoire", // API has capital D
                };
                
                // Use mapped name or original, then try direct match with API data
                const mappedCountryName = countryNameMapping[geoCountryName] || geoCountryName;
                
                // Try multiple matching strategies
                const countryData = mapData?.find(d => 
                  d.country === mappedCountryName || 
                  d.country === mappedCountryName?.toLowerCase() ||
                  d.country === mappedCountryName?.toUpperCase() ||
                  d.country === geoCountryName ||
                  d.country === geoCountryName?.toLowerCase() ||
                  d.country === geoCountryName?.toUpperCase() ||
                  // Special case for Côte d'Ivoire
                  (geoCountryName === "Côte d'Ivoire" && d.country === "Côte D'Ivoire")
                );
                
                // Show zero loss for countries without data
                const value = countryData?.tree_cover_loss_ha || 0;
                const color = colorMode === 'heatmap' ? getHeatmapColor(value, maxValue) : getColor(value, maxValue, colorMode);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke="#666666" // Lighter gray borders
                    strokeWidth={0.5}
                    style={{
                      default: { 
                        outline: 'none',
                        transition: 'fill 0.5s ease-in-out'
                      },
                      hover: { 
                        fill: 'hsl(var(--primary))', 
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'fill 0.2s ease-in-out'
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      setTooltipContent({
                        name: mappedCountryName || 'Unknown',
                        value: value || 0,
                      });
                    }}
                    onMouseLeave={() => setTooltipContent(null)}
                    onClick={() => {
                      if (mappedCountryName) {
                        onCountryClick(mappedCountryName);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Hover Tooltip */}
      {tooltipContent && (
        <div className="absolute top-4 left-4 glass-card rounded-lg p-3 pointer-events-none animate-fade-in">
          <p className="font-semibold text-foreground">{tooltipContent.name}</p>
          <p className="text-sm text-muted-foreground">
            {tooltipContent.value > 0 
              ? `${dataType === 'tree-cover' ? 'Tree Cover' : 'Primary Forest'} Loss: ${formatHectares(tooltipContent.value)}`
              : 'Zero loss'
            }
          </p>
        </div>
      )}
    </div>
  );
});

MapChart.displayName = 'MapChart';

export default function WorldMap() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(2001);
  const [dataType, setDataType] = useState<'tree-cover' | 'primary-forest'>('tree-cover');
  const [colorMode, setColorMode] = useState<'loss' | 'intensity' | 'hotspot' | 'heatmap'>('loss');
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([-10, -5]);
  const { data: mapData, isLoading: mapLoading } = useMapData(selectedYear);
  const { data: primaryMapData, isLoading: primaryLoading } = usePrimaryMapData(selectedYear);
  
  // Animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms per year
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  const years = Array.from({ length: 24 }, (_, i) => 2001 + i); // 2001 to 2024

  const handleZoomEnd = (e: { zoom: number; coordinates: [number, number] }) => {
    setZoom(e.zoom);
    setCenter(e.coordinates);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([-10, -5]);
  };

  // Animation controls
  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleStepForward = () => {
    const years = Array.from({ length: 24 }, (_, i) => 2001 + i); // 2001 to 2024
    const currentIndex = years.indexOf(selectedYear);
    if (currentIndex < years.length - 1) {
      setSelectedYear(years[currentIndex + 1]);
    }
  };

  const handleStepBackward = () => {
    const years = Array.from({ length: 24 }, (_, i) => 2001 + i); // 2001 to 2024
    const currentIndex = years.indexOf(selectedYear);
    if (currentIndex > 0) {
      setSelectedYear(years[currentIndex - 1]);
    }
  };

  // Animation effect
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = setInterval(() => {
        setSelectedYear(prevYear => {
          const years = Array.from({ length: 24 }, (_, i) => 2001 + i); // 2001 to 2024
          const currentIndex = years.indexOf(prevYear);
          if (currentIndex < years.length - 1) {
            return years[currentIndex + 1];
          } else {
            setIsPlaying(false);
            return prevYear;
          }
        });
      }, animationSpeed);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, animationSpeed]);

  return (
    <PageLayout>
      <div className="fixed inset-x-4 top-20 grid grid-cols-1 lg:grid-cols-6 gap-4 h-[calc(100vh-5rem)]">
        <div className="lg:col-span-1 overflow-y-auto">
          {/* Legend */}
          <div className="glass-card rounded-xl p-4 mb-2">
            <div className="flex flex-col gap-4">
              {/* Map Title */}
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">
                  {dataType === 'tree-cover' ? 'Tree Cover Loss' : 'Primary Forest Loss'} - {selectedYear}
                </h2>
                <p className="text-xs text-muted-foreground">Hover over countries to see details</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex flex-col gap-4">
              {/* Data Type */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Data Type</label>
                <Select value={dataType} onValueChange={(value: 'tree-cover' | 'primary-forest') => setDataType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tree-cover">Tree Cover Loss</SelectItem>
                    <SelectItem value="primary-forest">Primary Forest Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color Mode */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Visualization Mode</label>
                <Select value={colorMode} onValueChange={(value: 'loss' | 'intensity' | 'hotspot' | 'heatmap') => setColorMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loss">Loss (Green to Red)</SelectItem>
                    <SelectItem value="intensity">Intensity (Blue Gradient)</SelectItem>
                    <SelectItem value="hotspot">Hotspots (Red-Orange)</SelectItem>
                    <SelectItem value="heatmap">Heat Map (Full Spectrum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Year Selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Year: {selectedYear}</label>
                <Slider
                  value={[selectedYear]}
                  onValueChange={(value) => setSelectedYear(value[0])}
                  min={2001}
                  max={2024}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>2001</span>
                  <span>2024</span>
                </div>
              </div>

              {/* Animation Controls */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Time Animation</label>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStepBackward}
                    disabled={selectedYear === 2020}
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    onClick={isPlaying ? handlePause : handlePlay}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStepForward}
                    disabled={selectedYear === 2024}
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Animation Speed */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Speed (ms/year)</label>
                  <Slider
                    value={[animationSpeed]}
                    onValueChange={(value) => setAnimationSpeed(value[0])}
                    min={200}
                    max={3000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Fast</span>
                    <span>Slow</span>
                  </div>
                </div>
              </div>

              {/* Zoom Controls */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Zoom Controls</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.5))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(8, zoom + 0.5))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  Zoom: {zoom.toFixed(1)}x
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-xl h-full p-0 overflow-hidden">
            {mapLoading || primaryLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading map data...</p>
                </div>
              </div>
            ) : (
              <div className="h-full w-full p-0 m-0">
                <MapChart
                  year={selectedYear}
                  zoom={zoom}
                  center={center}
                  onZoomEnd={handleZoomEnd}
                  mapData={dataType === 'tree-cover' ? (mapData || []) : primaryMapData}
                  dataType={dataType}
                  colorMode={colorMode}
                  onCountryClick={(country) => {
                    navigate(`/country?country=${encodeURIComponent(country)}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

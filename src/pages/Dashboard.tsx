import { useState, useEffect, useMemo, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { 
  MapPin, 
  Activity, 
  AlertTriangle, 
  BarChart3,
  Download,
  Calendar,
  Filter,
  Gauge,
  Zap,
  TrendingUp,
  Loader2,
  Car,
  RefreshCw,
  Layers,
  CircleDot,
  ThermometerSun,
  Route,
  Clock,
  Eye
} from "lucide-react";
import { DashboardMap } from "@/components/DashboardMap";
import {
  fetchAllData,
  fetchAvailableCities,
  getCongestionColor,
  getDamageColor,
  filterCongestionByLevel,
  filterDamageByClassification,
} from "@/lib/dynamodb";
import { mockCities, getMockDataResponse, USE_MOCK_DATA } from "@/lib/mockData";
import {
  CongestionItem,
  DamageItem,
  DashboardStats,
  DashboardFilters,
  CityInfo,
  CONGESTION_LEVELS,
  PROPHET_CLASSIFICATIONS,
} from "@/lib/types";

// ============================================
// Animated Gauge Component
// ============================================
const AnimatedGauge = ({ 
  value, 
  max, 
  label, 
  sublabel,
  icon: Icon,
  color = "primary"
}: { 
  value: number; 
  max: number; 
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  color?: "primary" | "warning" | "danger" | "success";
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (color === "danger") return { stroke: "#ef4444", text: "text-red-500" };
    if (color === "warning") return { stroke: "#f59e0b", text: "text-amber-500" };
    if (color === "success") return { stroke: "#22c55e", text: "text-green-500" };
    return { stroke: "hsl(var(--primary))", text: "text-primary" };
  };
  
  const colorConfig = getColor();
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            className="opacity-30"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={colorConfig.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={`w-5 h-5 mb-1 ${colorConfig.text}`} />
          <span className="text-2xl font-bold">
            {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
};

// ============================================
// Severity Meter Component
// ============================================
const SeverityMeter = ({ value, max, label }: { value: number; max: number; label: string }) => {
  const percentage = (value / max) * 100;
  const getColor = () => {
    if (percentage < 33) return "bg-green-500";
    if (percentage < 66) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

// ============================================
// Map View Mode Type
// ============================================
type MapViewMode = 'congestion' | 'damage' | 'combined';

// ============================================
// Main Dashboard Component
// ============================================
const Dashboard = () => {
  // Data State
  const [congestionData, setCongestionData] = useState<CongestionItem[]>([]);
  const [damageData, setDamageData] = useState<DamageItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('combined');
  
  // Selection State
  const [selectedCongestion, setSelectedCongestion] = useState<CongestionItem | null>(null);
  const [selectedDamage, setSelectedDamage] = useState<DamageItem | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState<DashboardFilters>({
    city: 'mumbai', // Default city
    congestionLevel: 'all',
    prophetClassification: 'all',
    showCongestion: true,
    showDamage: true,
  });

  // Available cities for dropdown
  const [availableCities, setAvailableCities] = useState<CityInfo[]>([]);

  // Load available cities on mount
  useEffect(() => {
    const loadCities = async () => {
      if (USE_MOCK_DATA) {
        setAvailableCities(mockCities);
      } else {
        const cities = await fetchAvailableCities();
        if (cities.length > 0) {
          setAvailableCities(cities);
          // Set first city as default if current is not in list
          if (!cities.find(c => c.name === filters.city)) {
            setFilters(f => ({ ...f, city: cities[0].name }));
          }
        } else {
          // Fallback to mock cities
          setAvailableCities(mockCities);
        }
      }
    };
    loadCities();
  }, []);

  // ============================================
  // Data Fetching
  // ============================================
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setNotice(null);

      let data;
      if (USE_MOCK_DATA) {
        data = getMockDataResponse();
      } else {
        data = await fetchAllData(filters.city);
      }
      
      setCongestionData(data.congestion);
      setDamageData(data.damage);
      setStats(data.stats);
      
      // Auto-select first items
      if (data.congestion.length > 0 && !selectedCongestion) {
        setSelectedCongestion(data.congestion[0]);
      }
      if (data.damage.length > 0 && !selectedDamage) {
        setSelectedDamage(data.damage[0]);
      }

      if (data.congestion.length === 0 && data.damage.length === 0) {
        setNotice(`No data available for ${filters.city}. Try another city.`);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load data from DynamoDB');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.city]);

  // Initial load and city change
  useEffect(() => {
    if (filters.city) {
      loadData();
    }
  }, [filters.city, loadData]);

  // ============================================
  // Filtered Data
  // ============================================
  const filteredCongestion = useMemo(() => {
    if (!filters.showCongestion) return [];
    return filterCongestionByLevel(congestionData, filters.congestionLevel || 'all');
  }, [congestionData, filters.congestionLevel, filters.showCongestion]);

  const filteredDamage = useMemo(() => {
    if (!filters.showDamage) return [];
    return filterDamageByClassification(damageData, filters.prophetClassification || 'all');
  }, [damageData, filters.prophetClassification, filters.showDamage]);

  // ============================================
  // Chart Data
  // ============================================
  const congestionLevelDistribution = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    congestionData.forEach(item => {
      counts[item.congestion_level as keyof typeof counts]++;
    });
    return [
      { name: 'Low', value: counts.low, color: '#22c55e' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'High', value: counts.high, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [congestionData]);

  const damageClassificationDistribution = useMemo(() => {
    const counts = { good: 0, moderate: 0, severe: 0 };
    damageData.forEach(item => {
      counts[item.prophet_classification as keyof typeof counts]++;
    });
    return [
      { name: 'Good', value: counts.good, color: '#22c55e' },
      { name: 'Moderate', value: counts.moderate, color: '#eab308' },
      { name: 'Severe', value: counts.severe, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [damageData]);

  const vehicleCompositionData = useMemo(() => {
    if (congestionData.length === 0) return [];
    const totals = { light: 0, medium: 0, heavy: 0 };
    congestionData.forEach(item => {
      totals.light += item.vehicle_composition.light;
      totals.medium += item.vehicle_composition.medium;
      totals.heavy += item.vehicle_composition.heavy;
    });
    return [
      { name: 'Light', value: totals.light, color: '#22c55e' },
      { name: 'Medium', value: totals.medium, color: '#eab308' },
      { name: 'Heavy', value: totals.heavy, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [congestionData]);

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading data from DynamoDB...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 border-b border-border/50 glass-card">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Road Monitoring Dashboard</h1>
              <p className="text-muted-foreground">
                Real-time data from DynamoDB • City: {filters.city.charAt(0).toUpperCase() + filters.city.slice(1)}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* City Selector */}
              <Select
                value={filters.city}
                onValueChange={(value) => setFilters(f => ({ ...f, city: value }))}
              >
                <SelectTrigger className="w-48 glass-card">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Congestion Filter */}
              <Select
                value={filters.congestionLevel || 'all'}
                onValueChange={(value) => setFilters(f => ({ ...f, congestionLevel: value as any }))}
              >
                <SelectTrigger className="w-40 glass-card">
                  <Car className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Congestion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {CONGESTION_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCongestionColor(level) }} />
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Damage Filter */}
              <Select
                value={filters.prophetClassification || 'all'}
                onValueChange={(value) => setFilters(f => ({ ...f, prophetClassification: value as any }))}
              >
                <SelectTrigger className="w-40 glass-card">
                  <Route className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Road Quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  {PROPHET_CLASSIFICATIONS.map(classification => (
                    <SelectItem key={classification} value={classification}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDamageColor(classification) }} />
                        {classification.charAt(0).toUpperCase() + classification.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh Button */}
              <Button 
                variant="outline" 
                className="glass-card"
                onClick={() => loadData(true)}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {/* Export Button */}
              <Button className="gradient-primary shadow-glow">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}
          {notice && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600">
                <Clock className="w-4 h-4" />
                {notice}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Metrics Row */}
        <div className="mb-6 animate-in fade-in duration-500">
          <Card className="glass-card shadow-card overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Total Cells */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                  <AnimatedGauge
                    value={(stats?.totalCongestionCells || 0) + (stats?.totalDamageCells || 0)}
                    max={100}
                    label="Total Cells"
                    sublabel="H3 Hex Zones"
                    icon={Layers}
                    color="primary"
                  />
                </div>

                {/* Average Velocity */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10">
                  <AnimatedGauge
                    value={stats?.avgVelocity || 0}
                    max={60}
                    label="Avg Velocity"
                    sublabel="km/h"
                    icon={Gauge}
                    color="warning"
                  />
                </div>

                {/* Ride Comfort */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-transparent border border-green-500/10">
                  <AnimatedGauge
                    value={stats?.avgRideComfort || 0}
                    max={10}
                    label="Ride Comfort"
                    sublabel="Score 0-10"
                    icon={ThermometerSun}
                    color="success"
                  />
                </div>

                {/* Critical Areas */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-red-500/5 to-transparent border border-red-500/10">
                  <AnimatedGauge
                    value={(stats?.highCongestionCount || 0) + (stats?.severeDamageCount || 0)}
                    max={50}
                    label="Critical Areas"
                    sublabel="Needs Attention"
                    icon={AlertTriangle}
                    color="danger"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Column: Stats */}
          <div className="space-y-4">
            {/* Congestion Stats */}
            <Card className="glass-card shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Car className="w-4 h-4 text-primary" />
                    Congestion Overview
                  </span>
                  <Badge variant="outline">{congestionData.length} cells</Badge>
                </div>
                
                {congestionLevelDistribution.length > 0 ? (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={congestionLevelDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {congestionLevelDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    No congestion data
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {congestionLevelDistribution.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Damage Stats */}
            <Card className="glass-card shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Route className="w-4 h-4 text-amber-500" />
                    Road Quality
                  </span>
                  <Badge variant="outline">{damageData.length} cells</Badge>
                </div>
                
                {damageClassificationDistribution.length > 0 ? (
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={damageClassificationDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={50}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {damageClassificationDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                    No damage data
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {damageClassificationDistribution.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quick Stats</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Peak Hour Cells</span>
                    <span className="text-sm font-medium">{stats?.peakHourCells || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Events</span>
                    <span className="text-sm font-medium">{stats?.totalEvents || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">High Congestion</span>
                    <span className="text-sm font-medium text-orange-500">{stats?.highCongestionCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Severe Damage</span>
                    <span className="text-sm font-medium text-red-500">{stats?.severeDamageCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center: Map */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card shadow-card h-full">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    H3 Hex Map
                  </h2>
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <Button 
                      size="sm" 
                      variant={mapViewMode === 'combined' ? "default" : "ghost"} 
                      className="text-xs h-7"
                      onClick={() => setMapViewMode('combined')}
                    >
                      <Layers className="w-3 h-3 mr-1" />
                      Combined
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mapViewMode === 'congestion' ? "default" : "ghost"} 
                      className="text-xs h-7"
                      onClick={() => setMapViewMode('congestion')}
                    >
                      <Car className="w-3 h-3 mr-1" />
                      Traffic
                    </Button>
                    <Button 
                      size="sm" 
                      variant={mapViewMode === 'damage' ? "default" : "ghost"} 
                      className="text-xs h-7"
                      onClick={() => setMapViewMode('damage')}
                    >
                      <Route className="w-3 h-3 mr-1" />
                      Quality
                    </Button>
                  </div>
                </div>
                
                <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden">
                  <DashboardMap
                    congestionData={mapViewMode !== 'damage' ? filteredCongestion : []}
                    damageData={mapViewMode !== 'congestion' ? filteredDamage : []}
                    selectedCongestion={selectedCongestion}
                    selectedDamage={selectedDamage}
                    onCongestionSelect={setSelectedCongestion}
                    onDamageSelect={setSelectedDamage}
                  />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Low / Good</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">Medium / Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">High / Poor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Critical</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Congestion Details */}
            {selectedCongestion && (
              <Card className="glass-card shadow-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Congestion Details
                    </h3>
                    <Badge 
                      style={{ backgroundColor: getCongestionColor(selectedCongestion.congestion_level) }}
                      className="text-white"
                    >
                      {selectedCongestion.congestion_level}
                    </Badge>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Hex ID</div>
                      <div className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                        {selectedCongestion.hex_id}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Road Name</div>
                      <div className="font-medium">{selectedCongestion.road_name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Velocity</div>
                        <div className="font-medium">{selectedCongestion.velocity_avg.toFixed(1)} km/h</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Avg Vehicles</div>
                        <div className="font-medium">{selectedCongestion.vehicle_count_avg.toFixed(1)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Vehicle Composition</div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          L: {selectedCongestion.vehicle_composition.light}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          M: {selectedCongestion.vehicle_composition.medium}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          H: {selectedCongestion.vehicle_composition.heavy}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Peak Hour</div>
                        <div className="font-medium">
                          {selectedCongestion.peak_hour_flag ? '✅ Yes' : '❌ No'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Events</div>
                        <div className="font-medium">{selectedCongestion.event_count}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Last Updated</div>
                      <div className="text-xs">
                        {new Date(selectedCongestion.last_updated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Damage Details */}
            {selectedDamage && (
              <Card className="glass-card shadow-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Route className="w-4 h-4" />
                      Road Quality Details
                    </h3>
                    <Badge 
                      style={{ backgroundColor: getDamageColor(selectedDamage.prophet_classification) }}
                      className="text-white"
                    >
                      {selectedDamage.prophet_classification}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Hex ID</div>
                      <div className="font-mono text-xs bg-muted px-2 py-1 rounded truncate">
                        {selectedDamage.hex_id}
                      </div>
                    </div>

                    {/* Derived Metrics */}
                    {selectedDamage.derived_metrics && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Derived Metrics</div>
                      <SeverityMeter 
                        label="Roughness Index" 
                        value={selectedDamage.derived_metrics.roughness_index} 
                        max={5} 
                      />
                      <SeverityMeter 
                        label="Spike Index" 
                        value={selectedDamage.derived_metrics.spike_index} 
                        max={5} 
                      />
                      <SeverityMeter 
                        label="Jerk Magnitude" 
                        value={selectedDamage.derived_metrics.jerk_magnitude} 
                        max={10} 
                      />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Ride Comfort</span>
                        <span className="font-mono font-medium text-green-500">
                          {selectedDamage.derived_metrics.ride_comfort_score.toFixed(1)}/10
                        </span>
                      </div>
                    </div>
                    )}

                    {/* Damage Stats */}
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Damage Statistics</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Potholes:</span>{' '}
                          <span className="font-medium">{selectedDamage.total_potholes}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cracks:</span>{' '}
                          <span className="font-medium">{selectedDamage.total_cracks}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Severity:</span>{' '}
                          <span className="font-medium">{selectedDamage.damage_severity_score.toFixed(0)}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Damage Area:</span>{' '}
                          <span className="font-medium">{selectedDamage.road_damage_area_avg.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Sensor Metrics */}
                    {selectedDamage.sensor_metrics && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-2">Sensor Averages</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Acc X:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.acc_x_avg.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gyro X:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.gyro_x_avg.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Acc Y:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.acc_y_avg.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gyro Y:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.gyro_y_avg.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Acc Z:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.acc_z_avg.toFixed(3)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gyro Z:</span>{' '}
                          <span className="font-mono">{selectedDamage.sensor_metrics.gyro_z_avg.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-muted-foreground">Events</div>
                        <div className="font-medium text-sm">{selectedDamage.event_count}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Frequency</div>
                        <div className="font-medium text-sm">{selectedDamage.damage_frequency.toFixed(0)}%</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Last Updated</div>
                      <div className="text-xs">
                        {new Date(selectedDamage.last_updated).toLocaleString()}
                      </div>
                    </div>

                    {selectedDamage.last_corporation_visit && (
                      <div>
                        <div className="text-xs text-muted-foreground">Last Corp Visit</div>
                        <div className="text-xs">
                          {new Date(selectedDamage.last_corporation_visit).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Selection State */}
            {!selectedCongestion && !selectedDamage && (
              <Card className="glass-card shadow-card">
                <CardContent className="p-8 text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a hex cell on the map to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

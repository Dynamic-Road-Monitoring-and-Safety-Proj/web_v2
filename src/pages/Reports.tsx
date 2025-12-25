import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  MapPin, 
  Clock, 
  Loader2,
  Car,
  Route,
  RefreshCw,
  Database
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import {
  fetchAllData,
  fetchAvailableCities,
} from "@/lib/dynamodb";
import { CongestionItem, DamageItem, DashboardStats, CityInfo } from "@/lib/types";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const Reports = () => {
  const [congestionData, setCongestionData] = useState<CongestionItem[]>([]);
  const [damageData, setDamageData] = useState<DamageItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('patna');
  const [availableCities, setAvailableCities] = useState<CityInfo[]>([]);

  // Load available cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const cities = await fetchAvailableCities();
        if (cities.length > 0) {
          setAvailableCities(cities);
          if (!cities.find(c => c.name === selectedCity)) {
            setSelectedCity(cities[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, []);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const data = await fetchAllData(selectedCity);
      
      setCongestionData(data.congestion);
      setDamageData(data.damage);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedCity) {
      loadData();
    }
  }, [selectedCity]);

  // Chart data
  const congestionDistribution = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    congestionData.forEach(item => {
      counts[item.congestion_level as keyof typeof counts]++;
    });
    return [
      { name: 'Low', value: counts.low, color: '#22c55e' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'High', value: counts.high, color: '#ef4444' },
    ];
  }, [congestionData]);

  const damageDistribution = useMemo(() => {
    const counts = { good: 0, moderate: 0, severe: 0 };
    damageData.forEach(item => {
      counts[item.prophet_classification as keyof typeof counts]++;
    });
    return [
      { name: 'Good', value: counts.good, color: '#22c55e' },
      { name: 'Moderate', value: counts.moderate, color: '#eab308' },
      { name: 'Severe', value: counts.severe, color: '#ef4444' },
    ];
  }, [damageData]);

  const velocityByRoad = useMemo(() => {
    const roadData: { [key: string]: { total: number; count: number } } = {};
    congestionData.forEach(item => {
      const road = item.road_name || 'Unknown';
      if (!roadData[road]) {
        roadData[road] = { total: 0, count: 0 };
      }
      roadData[road].total += item.velocity_avg;
      roadData[road].count++;
    });
    return Object.entries(roadData)
      .map(([name, data]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '...' : name,
        velocity: data.total / data.count,
      }))
      .slice(0, 8);
  }, [congestionData]);

  const comfortScoreDistribution = useMemo(() => {
    // Comfort score is 0-100 scale based on actual data
    const ranges = { 'Poor (0-25)': 0, 'Fair (25-50)': 0, 'Good (50-75)': 0, 'Excellent (75-100)': 0 };
    damageData.forEach(item => {
      const score = item.derived_metrics?.ride_comfort_score || 50;
      if (score <= 25) ranges['Poor (0-25)']++;
      else if (score <= 50) ranges['Fair (25-50)']++;
      else if (score <= 75) ranges['Good (50-75)']++;
      else ranges['Excellent (75-100)']++;
    });
    return [
      { name: 'Poor', value: ranges['Poor (0-25)'], color: '#ef4444' },
      { name: 'Fair', value: ranges['Fair (25-50)'], color: '#f97316' },
      { name: 'Good', value: ranges['Good (50-75)'], color: '#eab308' },
      { name: 'Excellent', value: ranges['Excellent (75-100)'], color: '#22c55e' },
    ];
  }, [damageData]);

  // Export data as JSON
  const handleExport = () => {
    const exportData = {
      city: selectedCity,
      exportedAt: new Date().toISOString(),
      stats,
      congestion: congestionData,
      damage: damageData,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `road_report_${selectedCity}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = (type: 'congestion' | 'damage') => {
    let csv = '';
    if (type === 'congestion') {
      csv = 'hex_id,road_name,congestion_level,velocity_avg,vehicle_count_avg,peak_hour,event_count,lat,lon,last_updated\n';
      congestionData.forEach(item => {
        csv += `${item.hex_id},${item.road_name},${item.congestion_level},${item.velocity_avg},${item.vehicle_count_avg},${item.peak_hour_flag},${item.event_count},${item.location.lat},${item.location.lon},${item.last_updated}\n`;
      });
    } else {
      csv = 'hex_id,prophet_classification,ride_comfort_score,roughness_index,total_potholes,total_cracks,damage_area,event_count,lat,lon,last_updated\n';
      damageData.forEach(item => {
        const comfortScore = item.derived_metrics?.ride_comfort_score || 'N/A';
        const roughnessIndex = item.derived_metrics?.roughness_index || 'N/A';
        csv += `${item.hex_id},${item.prophet_classification},${comfortScore},${roughnessIndex},${item.total_potholes},${item.total_cracks},${item.road_damage_area_avg},${item.event_count},${item.location.lat},${item.location.lon},${item.last_updated}\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${selectedCity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Reports & Analytics
            </h1>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Data
              </span>
              <span>•</span>
              <span>{selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}</span>
              <span>•</span>
              <span>{congestionData.length + damageData.length} records</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* City Selector */}
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-48">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>{city.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="gradient-primary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { label: "Congestion Cells", value: stats?.totalCongestionCells || 0, icon: Car },
            { label: "Damage Cells", value: stats?.totalDamageCells || 0, icon: Route },
            { label: "Total Events", value: stats?.totalEvents || 0, icon: Database },
            { label: "Avg Comfort", value: `${stats?.avgRideComfort.toFixed(0) || 0}/100`, icon: TrendingUp }
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <motion.div 
          className="grid md:grid-cols-2 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Congestion Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="w-5 h-5" />
                  Traffic Congestion
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('congestion')}>
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={congestionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                      >
                        {congestionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} cells`, name]} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Road Quality Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="w-5 h-5" />
                  Road Quality
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleExportCSV('damage')}>
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={damageDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                      >
                        {damageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} cells`, name]} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs">{value}</span>}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Velocity by Road */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-5 h-5" />
                  Average Velocity by Road
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={velocityByRoad} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        unit=" km/h" 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={90} 
                        tick={{ fontSize: 9 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)} km/h`, 'Avg Velocity']}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="velocity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Comfort Score Distribution */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-5 h-5" />
                  Ride Comfort Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comfortScoreDistribution} margin={{ bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9 }}
                        angle={-20}
                        textAnchor="end"
                        height={50}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value} cells`, 'Count']}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {comfortScoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Data Tables Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Top Congested Areas */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-4 h-4 text-orange-500" />
                High Congestion Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {congestionData
                  .filter(c => c.congestion_level === 'high' || c.congestion_level === 'medium')
                  .sort((a, b) => {
                    if (a.congestion_level === 'high' && b.congestion_level !== 'high') return -1;
                    if (b.congestion_level === 'high' && a.congestion_level !== 'high') return 1;
                    return a.velocity_avg - b.velocity_avg;
                  })
                  .slice(0, 5)
                  .map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.road_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.velocity_avg.toFixed(1)} km/h • {item.vehicle_count_avg.toFixed(0)} vehicles
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={item.congestion_level === 'high' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}
                      >
                        {item.congestion_level}
                      </Badge>
                    </div>
                  ))}
                {congestionData.filter(c => c.congestion_level === 'high' || c.congestion_level === 'medium').length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-6">
                    ✅ No high congestion areas detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Severe Road Damage */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="w-4 h-4 text-red-500" />
                Road Quality Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {damageData
                  .filter(d => d.prophet_classification === 'severe' || d.prophet_classification === 'moderate')
                  .sort((a, b) => {
                    if (a.prophet_classification === 'severe' && b.prophet_classification !== 'severe') return -1;
                    if (b.prophet_classification === 'severe' && a.prophet_classification !== 'severe') return 1;
                    return (a.derived_metrics?.ride_comfort_score || 0) - (b.derived_metrics?.ride_comfort_score || 0);
                  })
                  .slice(0, 5)
                  .map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm font-mono truncate">{item.hex_id.slice(0, 14)}...</p>
                        <p className="text-xs text-muted-foreground">
                          Comfort: {item.derived_metrics?.ride_comfort_score?.toFixed(0) || 'N/A'}/100 • 
                          Roughness: {item.derived_metrics?.roughness_index?.toFixed(3) || 'N/A'}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={item.prophet_classification === 'severe' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}
                      >
                        {item.prophet_classification}
                      </Badge>
                    </div>
                  ))}
                {damageData.filter(d => d.prophet_classification === 'severe' || d.prophet_classification === 'moderate').length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-6">
                    ✅ No severe damage areas detected
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SemiCircleMeter } from "@/components/ui/gradient-meter";
import { motion } from "framer-motion";
import { Activity, Loader2, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface AirQualityData {
  "PM1.0(µg/m³)": number;
  "PM2.5(µg/m³)": number;
  "PM10(µg/m³)": number;
  "CO2(ppm)": number;
  "CH2O(mg/m³)": number;
  "NO2(ppm)": number;
  "TVOC(grade)": number;
  "Temperature(°C)": number;
  "Humidity(%RH)": number;
  [key: string]: any;
}

interface MeterConfig {
  key: string;
  label: string;
  unit: string;
  max: number;
}

const meterConfigs: MeterConfig[] = [
  { key: "PM1.0(µg/m³)", label: "PM1.0", unit: "µg/m³", max: 200 },
  { key: "PM2.5(µg/m³)", label: "PM2.5", unit: "µg/m³", max: 200 },
  { key: "PM10(µg/m³)", label: "PM10", unit: "µg/m³", max: 200 },
  { key: "CO2(ppm)", label: "CO2", unit: "ppm", max: 2000 },
  { key: "CH2O(mg/m³)", label: "CH2O", unit: "mg/m³", max: 1 },
  { key: "NO2(ppm)", label: "NO2", unit: "ppm", max: 1 },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper function to format values with appropriate decimal places
const formatValue = (value: number, key: string): string => {
  // For CH2O and NO2, use 4 decimal places as they're in 0.0x range
  if (key === "CH2O(mg/m³)" || key === "NO2(ppm)") {
    return value.toFixed(4);
  }
  // For PM and CO2 metrics, use 3 decimal places for better precision
  return value.toFixed(3);
};

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

const ApiPage = () => {
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>(meterConfigs[0].key);
  const [historicalData, setHistoricalData] = useState<Record<string, HistoricalDataPoint[]>>({});
  const MAX_DATA_POINTS = 30; // Store last 30 data points

  const fetchAirQuality = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/air-quality/latest`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAirQualityData(data);
      
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      // Update historical data for all metrics
      setHistoricalData((prev) => {
        const updated = { ...prev };
        
        meterConfigs.forEach((config) => {
          const value = data[config.key] || 0;
          const existingData = updated[config.key] || [];
          const newDataPoint = { timestamp: timeString, value };
          
          // Add new data point and keep only last MAX_DATA_POINTS
          const newData = [...existingData, newDataPoint].slice(-MAX_DATA_POINTS);
          updated[config.key] = newData;
        });
        
        return updated;
      });
      
      setLastUpdated(now);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching air quality data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAirQuality();

    // Set up interval to fetch every 1 second
    const interval = setInterval(fetchAirQuality, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Air Quality Index (AQI)
                </h1>
                <p className="text-muted-foreground mt-2">
                  Real-time air quality data from environmental sensors
                </p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && (
                  <div className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
                <Button
                  onClick={fetchAirQuality}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}. Make sure the backend server is running.
                </AlertDescription>
              </Alert>
            )}
          </motion.div>

          {/* Loading State */}
          {isLoading && !airQualityData && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading air quality data...</p>
              </div>
            </div>
          )}

          {/* Meters Grid */}
          {airQualityData && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            >
              {meterConfigs.map((config) => {
                const value = airQualityData[config.key] || 0;
                // Determine decimal places for the meter display
                const decimalPlaces = (config.key === "CH2O(mg/m³)" || config.key === "NO2(ppm)") ? 4 : 3;
                
                return (
                  <motion.div key={config.key} variants={itemVariants}>
                    <Card className="glass-card hover:shadow-glow transition-all duration-300 overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Activity className="h-5 w-5 text-primary" />
                          {config.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center pb-6">
                        <SemiCircleMeter
                          value={value}
                          max={config.max}
                          size={200}
                          decimalPlaces={decimalPlaces}
                        />
                        <div className="mt-4 text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {typeof value === 'number' ? formatValue(value, config.key) : value}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {config.unit}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Time Series Graph */}
          {airQualityData && historicalData[selectedMetric]?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12"
            >
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <CardTitle>Time Series Data</CardTitle>
                    </div>
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {meterConfigs.map((config) => (
                          <SelectItem key={config.key} value={config.key}>
                            {config.label} ({config.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={historicalData[selectedMetric] || []}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="timestamp"
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(value) => {
                            // Show only every 5th tick to avoid overcrowding
                            const index = historicalData[selectedMetric]?.findIndex(
                              (d) => d.timestamp === value
                            );
                            return index % 5 === 0 ? value : "";
                          }}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: "hsl(var(--muted-foreground))" }}
                          label={{
                            value: meterConfigs.find((c) => c.key === selectedMetric)?.unit || "",
                            angle: -90,
                            position: "insideLeft",
                            style: { fill: "hsl(var(--muted-foreground))" },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => formatValue(value, selectedMetric)}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                          name={meterConfigs.find((c) => c.key === selectedMetric)?.label}
                          animationDuration={300}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing last {historicalData[selectedMetric]?.length || 0} data points
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiPage;

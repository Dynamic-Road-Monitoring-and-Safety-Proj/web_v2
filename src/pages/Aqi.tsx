import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SemiCircleMeter } from "@/components/ui/gradient-meter";
import { motion } from "framer-motion";
import { Activity, Loader2, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronDown } from "lucide-react";

interface AirQualityData {
  "PM1.0(µg/m³)": number;
  "PM2.5(µg/m³)": number;
  "PM10(µg/m³)": number;
  "CO2(ppm)": number;
  "CH2O(mg/m³)": number;
  "NO2(ppm)": number;
  [key: string]: any;
}

interface MeterConfig {
  key: string;
  label: string;
  unit: string;
  max: number;
  color: string;
}

const METER_CONFIGS: MeterConfig[] = [
  { key: "PM1.0(µg/m³)", label: "PM1.0", unit: "µg/m³", max: 200, color: "#ef4444" },
  { key: "PM2.5(µg/m³)", label: "PM2.5", unit: "µg/m³", max: 200, color: "#f97316" },
  { key: "PM10(µg/m³)", label: "PM10", unit: "µg/m³", max: 200, color: "#eab308" },
  { key: "CO2(ppm)", label: "CO2", unit: "ppm", max: 2000, color: "#22c55e" },
  { key: "CH2O(mg/m³)", label: "CH2O", unit: "mg/m³", max: 1, color: "#3b82f6" },
  { key: "NO2(ppm)", label: "NO2", unit: "ppm", max: 1, color: "#8b5cf6" },
];

const LAMBDA_URL = import.meta.env.VITE_LAMBDA_API_URL;
const MAX_DATA_POINTS = 30;

const formatValue = (value: number, key: string): string => {
  const decimals = key === "CH2O(mg/m³)" || key === "NO2(ppm)" ? 4 : 3;
  return value.toFixed(decimals);
};

interface HistoricalPoint {
  timestamp: string;
  [key: string]: string | number;
}

const AqiPage = () => {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([METER_CONFIGS[0].key]);
  const [history, setHistory] = useState<HistoricalPoint[]>([]);

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) && prev.length > 1 ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetch(`${LAMBDA_URL}/air-quality/latest`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setData(json);
      const time = new Date().toLocaleTimeString();
      setHistory((prev) => {
        const point: HistoricalPoint = { timestamp: time };
        METER_CONFIGS.forEach((cfg) => {
          point[cfg.key] = json[cfg.key] || 0;
        });
        return [...prev, point].slice(-MAX_DATA_POINTS);
      });
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!LAMBDA_URL) {
      setError("VITE_LAMBDA_API_URL not configured");
      setLoading(false);
      return;
    }
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!LAMBDA_URL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <Navigation />
        <div className="pt-24 px-4 flex items-center justify-center h-96">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>VITE_LAMBDA_API_URL environment variable not set</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Navigation />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Air Quality Index
                </h1>
                <p className="text-muted-foreground mt-2">Real-time sensor data from AWS Lambda</p>
              </div>
              <div className="flex items-center gap-4">
                {lastUpdated && <div className="text-sm text-muted-foreground">{lastUpdated.toLocaleTimeString()}</div>}
                <Button
                  onClick={fetchData}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </motion.div>

          {loading && !data && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}

          {data && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
              >
                {METER_CONFIGS.map((cfg) => {
                  const val = data[cfg.key] || 0;
                  return (
                    <motion.div key={cfg.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="glass-card hover:shadow-glow transition-all">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-primary" />
                            {cfg.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                          <SemiCircleMeter
                            value={val}
                            max={cfg.max}
                            size={200}
                            decimalPlaces={cfg.key === "CH2O(mg/m³)" || cfg.key === "NO2(ppm)" ? 4 : 3}
                          />
                          <div className="mt-4 text-center">
                            <div className="text-2xl font-bold">{formatValue(val, cfg.key)}</div>
                            <div className="text-sm text-muted-foreground">{cfg.unit}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>

              {history.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12">
                  <Card className="glass-card">
                    <CardHeader>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <CardTitle>Time Series</CardTitle>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[220px] justify-between">
                              <span className="truncate">
                                {selectedMetrics.length === 1
                                  ? METER_CONFIGS.find((c) => c.key === selectedMetrics[0])?.label
                                  : `${selectedMetrics.length} metrics`}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[220px] p-2" align="end">
                            <div className="flex flex-col gap-1">
                              {METER_CONFIGS.map((cfg) => (
                                <label key={cfg.key} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer">
                                  <Checkbox
                                    checked={selectedMetrics.includes(cfg.key)}
                                    onCheckedChange={() => toggleMetric(cfg.key)}
                                  />
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                                  <span className="text-sm">{cfg.label} ({cfg.unit})</span>
                                </label>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="timestamp"
                            className="text-xs"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            tickFormatter={(v, i) => (i % 5 === 0 ? v : "")}
                          />
                          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--popover))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(v: number, name: string) => [formatValue(v, name), METER_CONFIGS.find((c) => c.key === name)?.label || name]}
                          />
                          <Legend formatter={(v) => METER_CONFIGS.find((c) => c.key === v)?.label || v} />
                          {selectedMetrics.map((key) => {
                            const cfg = METER_CONFIGS.find((c) => c.key === key);
                            return <Line key={key} type="monotone" dataKey={key} stroke={cfg?.color} strokeWidth={2} dot={false} animationDuration={300} />;
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-sm text-muted-foreground text-center">
                        {history.length} points • {selectedMetrics.length} metric{selectedMetrics.length > 1 ? "s" : ""}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AqiPage;

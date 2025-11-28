import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { 
  MapPin, 
  Activity, 
  AlertTriangle, 
  BarChart3,
  Video,
  Download,
  Users,
  Play,
  Pause,
  Calendar,
  Filter,
  Gauge,
  Zap,
  TrendingUp,
  Cog,
  Loader2
} from "lucide-react";
import { mockEvents, calculateMetrics, mockVideos, Event } from "@/lib/mockData";
import { fetchDashboardEvents, fetchDashboardVideos, processAllData, getProcessingStatus, getAnnotatedVideos, AnnotatedVideo } from "@/lib/api";
import { DashboardMap } from "@/components/DashboardMap";

// Custom animated gauge component for the top metrics
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
  color?: "primary" | "warning" | "danger";
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const getColor = () => {
    if (color === "danger") return { stroke: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", text: "text-red-500" };
    if (color === "warning") return { stroke: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", text: "text-amber-500" };
    return { stroke: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", text: "text-primary" };
  };
  
  // For severity-based coloring (green to red)
  const getSeverityColor = () => {
    if (percentage < 33) return { stroke: "#22c55e", glow: "0 0 20px rgba(34, 197, 94, 0.4)" };
    if (percentage < 66) return { stroke: "#f59e0b", glow: "0 0 20px rgba(245, 158, 11, 0.4)" };
    return { stroke: "#ef4444", glow: "0 0 20px rgba(239, 68, 68, 0.4)" };
  };
  
  const colorConfig = color === "primary" ? getColor() : getSeverityColor();
  const strokeColor = "stroke" in colorConfig ? colorConfig.stroke : getColor().stroke;
  
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            className="opacity-30"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ 
              filter: `drop-shadow(${("glow" in colorConfig) ? colorConfig.glow : "0 0 10px hsl(var(--primary) / 0.4)"})`
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            <Icon className={`w-5 h-5 mb-1 ${typeof value === 'number' && max <= 10 ? (percentage < 33 ? "text-green-500" : percentage < 66 ? "text-amber-500" : "text-red-500") : "text-primary"}`} />
          </motion.div>
          <motion.span 
            className="text-2xl font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(1)) : value}
          </motion.span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
};

// Small inline severity meter for event details
const InlineSeverityMeter = ({ value, max, label }: { value: number; max: number; label: string }) => {
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
        <span className="font-mono font-medium">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [unprocessedCount, setUnprocessedCount] = useState<number>(0);
  const [annotatedVideos, setAnnotatedVideos] = useState<AnnotatedVideo[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const fetchProcessingStatus = async () => {
    const status = await getProcessingStatus();
    setUnprocessedCount(status.unprocessed);
  };

  const handleProcessAll = async () => {
    try {
      setIsProcessing(true);
      setProcessingMessage("Starting ML pipeline...");
      const result = await processAllData();
      setProcessingMessage(`Processing ${result.total_pairs} video(s) in background...`);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setProcessingMessage(null);
        setIsProcessing(false);
        fetchProcessingStatus(); // Refresh count
      }, 5000);
    } catch (error: any) {
      setProcessingMessage(`Error: ${error.message}`);
      setTimeout(() => {
        setProcessingMessage(null);
        setIsProcessing(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedEvents, fetchedVideos, fetchedAnnotatedVideos] = await Promise.all([
          fetchDashboardEvents(),
          fetchDashboardVideos(),
          getAnnotatedVideos(5)
        ]);
        setEvents(fetchedEvents);
        setVideos(fetchedVideos);
        setAnnotatedVideos(fetchedAnnotatedVideos);
        
        // Set the first annotated video as selected if available
        if (fetchedAnnotatedVideos.length > 0) {
          setSelectedVideoUrl(fetchedAnnotatedVideos[0].url);
        }
        
        // Fetch processing status
        fetchProcessingStatus();
        
        if (fetchedEvents.length > 0) {
          // Try to find an event that has a corresponding video
          const eventWithVideo = fetchedEvents.find(event => {
            const timestampStr = event.event_timestamp.replace(/:/g, '-').replace(' ', '_');
            return fetchedVideos.some((v: any) => v.filename && v.filename.includes(timestampStr));
          });
          
          setSelectedEvent(eventWithVideo || fetchedEvents[0]);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        // Fallback to mock data if fetch fails
        setEvents(mockEvents);
        setVideos(mockVideos);
        setSelectedEvent(mockEvents[0]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const metrics = calculateMetrics(events.length > 0 ? events : mockEvents);
  const displayVideos = videos.length > 0 ? videos : mockVideos;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayEvents = events.length > 0 ? events : mockEvents;
  const currentEvent = selectedEvent || displayEvents[0];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <div className="pt-20 pb-6 px-4 sm:px-6 lg:px-8 border-b border-border/50 glass-card">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Chandigarh, Punjab</h1>
              <p className="text-muted-foreground">Real-time road monitoring dashboard</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                className="glass-card relative"
                onClick={handleProcessAll}
                disabled={isProcessing || unprocessedCount === 0}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Cog className="w-4 h-4 mr-2" />
                )}
                {isProcessing ? "Processing..." : "Process All"}
                {unprocessedCount > 0 && !isProcessing && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unprocessedCount}
                  </span>
                )}
              </Button>
              <Button variant="outline" className="glass-card">
                <Calendar className="w-4 h-4 mr-2" />
                Last 24h
              </Button>
              <Button variant="outline" className="glass-card">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" className="glass-card">
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Time-lapse
              </Button>
              <Button className="gradient-primary shadow-glow">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          {processingMessage && (
            <div className="mt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {processingMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top Metrics Row - Three Key Indicators */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card shadow-card overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Events */}
                <motion.div 
                  className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatedGauge
                    value={metrics.totalEvents}
                    max={1000}
                    label="Total Events"
                    sublabel="Last 24 hours"
                    icon={TrendingUp}
                    color="primary"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Live tracking</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-green-500 font-medium">+12%</span> from yesterday
                    </div>
                  </div>
                </motion.div>

                {/* Average Roughness */}
                <motion.div 
                  className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatedGauge
                    value={metrics.avgRoughness}
                    max={10}
                    label="Avg Roughness"
                    sublabel="Road Quality Index"
                    icon={BarChart3}
                    color="warning"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Scale: 0 (smooth) - 10 (severe)
                    </div>
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 flex-1 rounded-full ${
                            i < metrics.avgRoughness 
                              ? metrics.avgRoughness < 3.3 ? 'bg-green-500' : metrics.avgRoughness < 6.6 ? 'bg-amber-500' : 'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Average Impact */}
                <motion.div 
                  className="flex items-center gap-6 p-4 rounded-xl bg-gradient-to-br from-red-500/5 to-transparent border border-red-500/10"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatedGauge
                    value={metrics.avgImpactIntensity}
                    max={5}
                    label="Avg Impact"
                    sublabel="Intensity Level"
                    icon={Zap}
                    color="danger"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Scale: 0 (low) - 5 (high)
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 flex-1 rounded-full ${
                            i < metrics.avgImpactIntensity 
                              ? metrics.avgImpactIntensity < 1.7 ? 'bg-green-500' : metrics.avgImpactIntensity < 3.3 ? 'bg-amber-500' : 'bg-red-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Left: Secondary KPI Cards */}
          <div className="space-y-4">
            <motion.div variants={item}>
              <Card className="glass-card shadow-card border-l-4 border-l-urgent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Needs Attention</span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <AlertTriangle className="w-4 h-4 text-urgent" />
                    </motion.div>
                  </div>
                  <div className="text-3xl font-bold text-urgent mb-2">{metrics.needsAttention}</div>
                  <Meter value={metrics.needsAttention} max={50} color="bg-urgent" />
                  <div className="text-xs text-muted-foreground mt-2">Urgent fixes required</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Traffic Density</span>
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{metrics.avgTrafficDensity}</div>
                  <Meter value={metrics.avgTrafficDensity} max={20} color="bg-primary" />
                  <div className="text-xs text-muted-foreground mt-2">Vehicles/frame</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Quick Stats</span>
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Pothole Events</span>
                      <span className="text-sm font-medium">{displayEvents.filter(e => e.pothole_confidence > 0.5).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">High Severity</span>
                      <span className="text-sm font-medium text-red-500">{displayEvents.filter(e => e.roughness_index > 7).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Resolved Today</span>
                      <span className="text-sm font-medium text-green-500">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Center: Map and Video */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Section */}
            <motion.div variants={item}>
              <Card className="glass-card shadow-card h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Interactive Map
                    </h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Potholes
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        AQI
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        Traffic
                      </Button>
                    </div>
                  </div>
                  
                  <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden">
                    <DashboardMap 
                      events={displayEvents} 
                      selectedEvent={currentEvent} 
                      onEventSelect={setSelectedEvent} 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-urgent border-2 border-urgent" />
                      <span className="text-muted-foreground">Urgent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary" />
                      <span className="text-muted-foreground">Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted border-2 border-border" />
                      <span className="text-muted-foreground">Resolved</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Video Section */}
            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      Annotated Video
                    </h2>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        Bounding Boxes
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        Telemetry
                      </Button>
                    </div>
                  </div>

                  {/* Video Selector Dropdown */}
                  {annotatedVideos.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Select Video:</span>
                      <Select
                        value={selectedVideoUrl || ""}
                        onValueChange={(url) => setSelectedVideoUrl(url)}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Select a video" />
                        </SelectTrigger>
                        <SelectContent>
                          {annotatedVideos.map((video) => (
                            <SelectItem key={video.filename} value={video.url}>
                              {video.filename} ({video.size_mb} MB)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden flex items-center justify-center">
                    {selectedVideoUrl ? (
                      <video 
                        key={selectedVideoUrl}
                        src={selectedVideoUrl} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    ) : currentEvent.video_url ? (
                      <video 
                        src={currentEvent.video_url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                          <Play className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">No annotated videos available</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Process videos to generate annotated output
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right: Event Details */}
          <div className="space-y-4">
            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Event Details</h3>
                    {currentEvent.needs_attention && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium gradient-urgent text-urgent-foreground">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Location</div>
                      <div className="font-medium">{currentEvent.sector}</div>
                      <div className="text-sm text-muted-foreground">{currentEvent.street_name}</div>
                    </div>

                    <div className="space-y-3">
                      <Meter 
                        label="Confidence" 
                        value={currentEvent.pothole_confidence * 100} 
                        max={100} 
                        color="bg-primary" 
                      />
                      <InlineSeverityMeter 
                        label="Roughness" 
                        value={currentEvent.roughness_index} 
                        max={10} 
                      />
                      <InlineSeverityMeter 
                        label="Impact" 
                        value={currentEvent.impact_intensity} 
                        max={5} 
                      />
                      <Meter 
                        label="Validation" 
                        value={currentEvent.validation_score * 100} 
                        max={100} 
                        color="bg-green-500" 
                      />
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Traffic</div>
                      <div className="font-medium">
                        {currentEvent.avg_vehicles_per_frame.toFixed(1)} avg / {currentEvent.peak_vehicle_count} peak
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-muted-foreground">Timestamp</div>
                      <div className="text-sm">
                        {new Date(currentEvent.event_timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 space-y-2">
                    <Button className="w-full gradient-primary shadow-glow" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Assign to Crew
                    </Button>
                    <Button variant="outline" className="w-full glass-card" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold text-sm">Sensor Telemetry</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { name: 't-5', ax: currentEvent.accel.ax * 0.8, ay: currentEvent.accel.ay * 0.9, az: currentEvent.accel.az * 0.95 },
                          { name: 't-4', ax: currentEvent.accel.ax * 1.1, ay: currentEvent.accel.ay * 0.7, az: currentEvent.accel.az * 1.02 },
                          { name: 't-3', ax: currentEvent.accel.ax * 0.9, ay: currentEvent.accel.ay * 1.2, az: currentEvent.accel.az * 0.98 },
                          { name: 't-2', ax: currentEvent.accel.ax * 1.3, ay: currentEvent.accel.ay * 0.85, az: currentEvent.accel.az * 1.05 },
                          { name: 't-1', ax: currentEvent.accel.ax * 0.95, ay: currentEvent.accel.ay * 1.1, az: currentEvent.accel.az * 1.01 },
                          { name: 'now', ax: currentEvent.accel.ax, ay: currentEvent.accel.ay, az: currentEvent.accel.az },
                        ]}
                        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Line type="monotone" dataKey="ax" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Accel X" />
                        <Line type="monotone" dataKey="ay" stroke="#eab308" strokeWidth={2} dot={{ r: 3 }} name="Accel Y" />
                        <Line type="monotone" dataKey="az" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Accel Z" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">X: {currentEvent.accel.ax.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span className="text-muted-foreground">Y: {currentEvent.accel.ay.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">Z: {currentEvent.accel.az.toFixed(3)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gyro Intensity</span>
                      <span className="font-mono">{currentEvent.gyro_intensity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">AZ Spike</span>
                      <span className="font-mono text-red-500">{currentEvent.az_spike.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Meter, RadialProgress } from "@/components/ui/meter";
import { motion } from "framer-motion";
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
  Filter
} from "lucide-react";
import { mockEvents, calculateMetrics, mockVideos, Event } from "@/lib/mockData";
import { fetchDashboardEvents, fetchDashboardVideos } from "@/lib/api";
import { DashboardMap } from "@/components/DashboardMap";

const Dashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedEvents, fetchedVideos] = await Promise.all([
          fetchDashboardEvents(),
          fetchDashboardVideos()
        ]);
        setEvents(fetchedEvents);
        setVideos(fetchedVideos);
        
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
        </div>
      </div>

      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div 
          className="grid lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Left: KPI Cards */}
          <div className="space-y-4">
            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Events</div>
                    <div className="text-3xl font-bold">{metrics.totalEvents}</div>
                  </div>
                  <RadialProgress 
                    value={metrics.totalEvents} 
                    max={1000} 
                    size={60} 
                    strokeWidth={6} 
                    className="text-primary"
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-card shadow-card border-l-4 border-l-urgent">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Needs Attention</span>
                    <AlertTriangle className="w-4 h-4 text-urgent" />
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
                    <span className="text-sm text-muted-foreground">Avg Roughness</span>
                    <BarChart3 className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{metrics.avgRoughness}</div>
                  <Meter value={parseFloat(metrics.avgRoughness)} max={10} color="bg-secondary" />
                  <div className="text-xs text-muted-foreground mt-2">Index 0-10 scale</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className="glass-card shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg Impact</span>
                    <Activity className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{metrics.avgImpactIntensity}</div>
                  <Meter value={parseFloat(metrics.avgImpactIntensity)} max={5} color="bg-destructive" />
                  <div className="text-xs text-muted-foreground mt-2">Severity metric</div>
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
                  <Meter value={parseFloat(metrics.avgTrafficDensity)} max={20} color="bg-primary" />
                  <div className="text-xs text-muted-foreground mt-2">Vehicles/frame</div>
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

                  <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden flex items-center justify-center">
                    {currentEvent.video_url ? (
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
                          <p className="font-medium">Select an event to view video</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {displayVideos.length} annotated videos available
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
                      <Meter 
                        label="Roughness" 
                        value={currentEvent.roughness_index} 
                        max={10} 
                        color="bg-secondary" 
                      />
                      <Meter 
                        label="Impact" 
                        value={currentEvent.impact_intensity} 
                        max={5} 
                        color="bg-destructive" 
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Accel X</span>
                      <span className="font-mono">{currentEvent.accel.ax.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Accel Y</span>
                      <span className="font-mono">{currentEvent.accel.ay.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Accel Z</span>
                      <span className="font-mono">{currentEvent.accel.az.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Gyro</span>
                      <span className="font-mono">{currentEvent.gyro_intensity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">AZ Spike</span>
                      <span className="font-mono">{currentEvent.az_spike.toFixed(2)}</span>
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

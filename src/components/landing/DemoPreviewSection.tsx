import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, AlertTriangle, Activity } from "lucide-react";
import { mockEvents, calculateMetrics } from "@/lib/mockData";
import { Link } from "react-router-dom";

export const DemoPreviewSection = () => {
  const metrics = calculateMetrics(mockEvents);

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            See it in action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore live data from Chandigarh, Punjab. Interact with the map, 
            view annotated videos, and see how our AI detects road hazards in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Mini Map Preview */}
          <Card className="lg:col-span-2 glass-card shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Chandigarh Live Map
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary animate-pulse-glow">
                Live
              </span>
            </div>
            
            <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simplified map representation */}
                <div className="relative w-full h-full">
                  {mockEvents.slice(0, 4).map((event, index) => (
                    <div
                      key={event.id}
                      className="absolute w-6 h-6 rounded-full bg-urgent/20 border-2 border-urgent animate-pulse-glow cursor-pointer hover:scale-125 transition-transform"
                      style={{
                        left: `${20 + index * 20}%`,
                        top: `${30 + (index % 2) * 30}%`,
                        animationDelay: `${index * 200}ms`,
                      }}
                      title={event.street_name}
                    >
                      <div className="absolute inset-0 rounded-full bg-urgent/50 animate-ping" />
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-2 bg-background/80 backdrop-blur-sm rounded-xl p-6">
                      <AlertTriangle className="w-8 h-8 mx-auto text-urgent" />
                      <p className="text-sm font-medium">
                        {mockEvents.filter(e => e.needs_attention).length} hotspots detected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/dashboard">
              <Button className="w-full gradient-primary shadow-glow hover:shadow-lg transition-all group">
                Open Full Dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </Card>

          {/* KPI Cards */}
          <div className="space-y-6">
            <Card className="glass-card shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">{metrics.totalEvents}</div>
              <div className="text-xs text-muted-foreground mt-1">Last 24 hours</div>
            </Card>

            <Card className="glass-card shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Urgent Events</span>
                <AlertTriangle className="w-4 h-4 text-urgent" />
              </div>
              <div className="text-3xl font-bold text-urgent">{metrics.needsAttention}</div>
              <div className="text-xs text-muted-foreground mt-1">Needs immediate attention</div>
            </Card>

            <Card className="glass-card shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Roughness</span>
                <Activity className="w-4 h-4 text-secondary" />
              </div>
              <div className="text-3xl font-bold">{metrics.avgRoughness}</div>
              <div className="text-xs text-muted-foreground mt-1">Index scale 0-10</div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

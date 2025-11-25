import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-20" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full text-sm font-medium glass-card shadow-soft">
                🚀 AI-Powered Road Safety
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              Make roads safer with{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                live, data-driven
              </span>{" "}
              detection
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              Detect potholes, prioritize fixes, and visualize traffic & air quality for Chandigarh. 
              Turn every camera into an intelligent road safety sensor.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="gradient-primary shadow-glow hover:shadow-lg transition-all text-lg px-8 group">
                Try the Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 group glass-card">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Video
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
              <div>
                <div className="text-3xl font-bold text-primary">1,247</div>
                <div className="text-sm text-muted-foreground">Events Detected</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">92%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative animate-scale-in">
            <div className="glass-card shadow-card rounded-3xl p-8 space-y-6 animate-float">
              {/* Mock device showing dashboard preview */}
              <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full gradient-primary animate-pulse-glow flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Interactive Dashboard Preview</p>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-2xl font-bold text-urgent">23</div>
                  <div className="text-xs text-muted-foreground">Urgent Events</div>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <div className="text-2xl font-bold text-primary">7.2</div>
                  <div className="text-xs text-muted-foreground">Avg Roughness</div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 glass-card rounded-full px-6 py-3 shadow-glow animate-pulse-glow">
              <span className="text-sm font-medium">Real-time Detection</span>
            </div>
            <div className="absolute -bottom-4 -left-4 glass-card rounded-full px-6 py-3 shadow-soft">
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

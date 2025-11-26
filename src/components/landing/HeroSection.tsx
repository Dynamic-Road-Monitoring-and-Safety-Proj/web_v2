import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-hero opacity-50" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-20" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="px-4 py-2 rounded-full text-sm font-medium glass-card shadow-soft flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                AI-Powered Road Safety
              </span>
            </motion.div>
            
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
              {[
                { value: "1,247", label: "Events Detected" },
                { value: "92%", label: "Accuracy" },
                { value: "24/7", label: "Monitoring" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="glass-card shadow-card rounded-3xl p-8 space-y-6 animate-float">
              {/* Mock device showing dashboard preview */}
              <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 overflow-hidden relative group cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 mx-auto rounded-full gradient-primary shadow-glow flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-sm font-medium text-white drop-shadow-md">Interactive Dashboard Preview</p>
                  </div>
                </div>
                
                {/* Simulated UI Elements */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <div className="h-2 w-20 bg-white/20 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl font-bold text-urgent">23</div>
                  <div className="text-xs text-muted-foreground">Urgent Events</div>
                  <div className="w-full bg-urgent/20 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-urgent h-full w-[70%]" />
                  </div>
                </motion.div>
                <motion.div 
                  className="glass-card p-4 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl font-bold text-primary">7.2</div>
                  <div className="text-xs text-muted-foreground">Avg Roughness</div>
                  <div className="w-full bg-primary/20 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[45%]" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div 
              className="absolute -top-4 -right-4 glass-card rounded-full px-6 py-3 shadow-glow"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Real-time Detection
              </span>
            </motion.div>
            <motion.div 
              className="absolute -bottom-4 -left-4 glass-card rounded-full px-6 py-3 shadow-soft"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <span className="text-sm font-medium">AI-Powered</span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
};

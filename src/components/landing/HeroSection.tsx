import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ChevronDown, MapPin, Activity, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Animated background particles
const FloatingParticle = ({ delay, duration, size, startX, startY }: { delay: number; duration: number; size: number; startX: number; startY: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${startX}%`, top: `${startY}%` }}
    animate={{
      y: [0, -100, 0],
      x: [0, 30, 0],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated road lines
const RoadLine = ({ delay, yPos }: { delay: number; yPos: number }) => (
  <motion.div
    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent"
    style={{ top: `${yPos}%` }}
    animate={{
      opacity: [0, 0.6, 0],
      scaleX: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Pulse rings
const PulseRing = ({ delay, size }: { delay: number; size: number }) => (
  <motion.div
    className="absolute rounded-full border-2 border-primary/30"
    style={{ width: size, height: size }}
    animate={{
      scale: [0.8, 1.5, 0.8],
      opacity: [0.5, 0, 0.5],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: "easeOut",
    }}
  />
);

// Animated data stream
const DataStream = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 bg-gradient-to-b from-primary via-secondary to-transparent rounded-full"
    style={{ height: '100px', left: `${Math.random() * 100}%` }}
    initial={{ top: '-100px', opacity: 0 }}
    animate={{
      top: ['0%', '100%'],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

export const HeroSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, hsl(186 75% 45% / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, hsl(220 70% 50% / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 80%, hsl(186 75% 45% / 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, hsl(186 75% 45% / 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <FloatingParticle
            key={i}
            delay={i * 0.5}
            duration={5 + Math.random() * 5}
            size={4 + Math.random() * 8}
            startX={Math.random() * 100}
            startY={Math.random() * 100}
          />
        ))}
      </div>

      {/* Road lines animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {[...Array(5)].map((_, i) => (
          <RoadLine key={i} delay={i * 0.8} yPos={20 + i * 15} />
        ))}
      </div>

      {/* Data streams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(8)].map((_, i) => (
          <DataStream key={i} delay={i * 0.3} />
        ))}
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-10" />
      
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Live Monitoring Active
              </span>
            </motion.div>
            
            <motion.h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="block">Road Drivability &</span>
              <span className="block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                City Monitoring
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-muted-foreground max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              AI-powered platform detecting potholes, congestion, accidents, and infrastructure issues. 
              Real-time drivability scores and alerts for smarter, safer cities.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button size="lg" className="gradient-primary shadow-glow hover:shadow-lg transition-all text-lg px-8 group">
                Try the Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 group glass-card">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Video
              </Button>
            </motion.div>

            {/* Feature pills */}
            <motion.div 
              className="flex flex-wrap gap-3 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[
                { icon: MapPin, text: "Pothole Detection" },
                { icon: Activity, text: "Traffic Analysis" },
                { icon: Shield, text: "Safety Alerts" },
                { icon: Zap, text: "Real-time" },
              ].map((item, i) => (
                <motion.span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-muted/50 border border-border/50"
                  whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  {item.text}
                </motion.span>
              ))}
            </motion.div>

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
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.div 
                    className="text-3xl font-bold text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                  >
                    {stat.value}
                  </motion.div>
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
            style={{
              transform: `perspective(1000px) rotateY(${mousePosition.x * 0.02}deg) rotateX(${-mousePosition.y * 0.02}deg)`,
            }}
          >
            {/* Pulse rings behind card */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PulseRing delay={0} size={300} />
              <PulseRing delay={1} size={400} />
              <PulseRing delay={2} size={500} />
            </div>

            <div className="glass-card shadow-card rounded-3xl p-8 space-y-6 relative z-10">
              {/* Mock dashboard preview */}
              <div className="aspect-video rounded-xl bg-gradient-to-br from-muted/80 to-muted/30 border-2 border-border/50 overflow-hidden relative group cursor-pointer">
                {/* Animated scan line */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Map visualization mock */}
                <div className="absolute inset-4 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                  {/* Animated markers */}
                  {[
                    { x: 20, y: 30, color: 'bg-red-500', delay: 0 },
                    { x: 60, y: 45, color: 'bg-yellow-500', delay: 0.5 },
                    { x: 40, y: 70, color: 'bg-green-500', delay: 1 },
                    { x: 75, y: 25, color: 'bg-red-500', delay: 1.5 },
                    { x: 30, y: 55, color: 'bg-primary', delay: 2 },
                  ].map((marker, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-3 h-3 ${marker.color} rounded-full`}
                      style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        delay: marker.delay,
                        repeat: Infinity,
                      }}
                    />
                  ))}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="text-center space-y-2">
                    <motion.div 
                      className="w-16 h-16 mx-auto rounded-full gradient-primary shadow-glow flex items-center justify-center"
                      whileHover={{ scale: 1.1 }}
                      animate={{ boxShadow: ['0 0 20px hsl(186 85% 65% / 0.3)', '0 0 40px hsl(186 85% 65% / 0.5)', '0 0 20px hsl(186 85% 65% / 0.3)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="w-8 h-8 text-white ml-1" />
                    </motion.div>
                    <p className="text-sm font-medium text-white drop-shadow-md">Live Dashboard Preview</p>
                  </div>
                </div>
              </div>

              {/* Quick stats with animations */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div 
                  className="glass-card p-4 rounded-xl relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="relative">
                    <div className="text-2xl font-bold text-urgent">23</div>
                    <div className="text-xs text-muted-foreground">Urgent Events</div>
                    <div className="w-full bg-urgent/20 h-1.5 mt-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-yellow-500 to-red-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                </motion.div>
                <motion.div 
                  className="glass-card p-4 rounded-xl relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-primary/10"
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                  <div className="relative">
                    <div className="text-2xl font-bold text-primary">7.2</div>
                    <div className="text-xs text-muted-foreground">Drivability Score</div>
                    <div className="w-full bg-primary/20 h-1.5 mt-2 rounded-full overflow-hidden">
                      <motion.div 
                        className="bg-gradient-to-r from-green-500 to-primary h-full"
                        initial={{ width: 0 }}
                        animate={{ width: '72%' }}
                        transition={{ duration: 1, delay: 0.7 }}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating badges with enhanced animations */}
            <motion.div 
              className="absolute -top-4 -right-4 glass-card rounded-full px-6 py-3 shadow-glow z-20"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Real-time Detection
              </span>
            </motion.div>
            <motion.div 
              className="absolute -bottom-4 -left-4 glass-card rounded-full px-6 py-3 shadow-soft z-20"
              animate={{ 
                y: [0, 10, 0],
                rotate: [0, -2, 0, 2, 0],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                AI-Powered
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground flex flex-col items-center gap-2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs">Scroll to explore</span>
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
};

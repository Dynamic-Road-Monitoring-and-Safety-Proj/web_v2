import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MapPin, AlertTriangle, Activity, TrendingUp, Zap, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// Static demo data for landing page preview - doesn't require database connection
const demoStats = {
  totalEvents: 248,
  severeDamageCount: 12,
  highCongestionCount: 8,
  totalPotholes: 156,
};

// Demo hex positions for visualization
const demoHexPoints = [
  { id: 1, x: 20, y: 30 },
  { id: 2, x: 45, y: 55 },
  { id: 3, x: 65, y: 35 },
  { id: 4, x: 80, y: 60 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const DemoPreviewSection = () => {
  const stats = demoStats;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-30" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 20}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              delay: i
            }}
          />
        ))}
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold">
            See it in <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore live data from Chandigarh, Punjab. Interact with the map, 
            view annotated videos, and see how our AI detects road hazards in real-time.
          </p>
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Mini Map Preview */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="glass-card shadow-card p-6 space-y-4 h-full">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Chandigarh Live Map
                </h3>
                <motion.span 
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </motion.span>
              </div>
              
              <div className="aspect-video rounded-xl bg-muted/50 border-2 border-border/50 relative overflow-hidden">
                {/* Animated grid lines */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Simplified map representation */}
                  <div className="relative w-full h-full">
                    {demoHexPoints.map((point, index) => (
                      <motion.div
                        key={point.id}
                        className="absolute w-6 h-6 rounded-full bg-urgent/20 border-2 border-urgent cursor-pointer hover:scale-125 transition-transform"
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.2, duration: 0.5 }}
                        whileHover={{ scale: 1.3 }}
                        title={`Detection Point ${point.id}`}
                      >
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-urgent/50"
                          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        />
                      </motion.div>
                    ))}
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                    >
                      <div className="text-center space-y-2 bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                        <motion.div
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-8 h-8 mx-auto text-urgent" />
                        </motion.div>
                        <p className="text-sm font-medium">
                          {stats.severeDamageCount} severe damage areas detected
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>

              <Link to="/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full gradient-primary shadow-glow hover:shadow-lg transition-all group">
                    Open Full Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>
            </Card>
          </motion.div>

          {/* KPI Cards */}
          <motion.div variants={itemVariants} className="space-y-6">
            <motion.div whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card shadow-card p-6 group hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Activity className="w-4 h-4 text-primary" />
                  </motion.div>
                </div>
                <motion.div 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {stats.totalEvents}
                </motion.div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  From monitored areas
                </div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card shadow-card p-6 group hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Severe Areas</span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <AlertTriangle className="w-4 h-4 text-urgent" />
                  </motion.div>
                </div>
                <motion.div 
                  className="text-3xl font-bold text-urgent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  {stats.severeDamageCount + stats.highCongestionCount}
                </motion.div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-urgent" />
                  Needs attention
                </div>
              </Card>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03, y: -5 }} transition={{ duration: 0.2 }}>
              <Card className="glass-card shadow-card p-6 group hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Potholes</span>
                  <Activity className="w-4 h-4 text-secondary" />
                </div>
                <motion.div 
                  className="text-3xl font-bold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {stats.totalPotholes}
                </motion.div>
                <div className="text-xs text-muted-foreground mt-1">Detected across all areas</div>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

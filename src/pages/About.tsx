import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, Eye, MapPin, Shield, Users, Building2, Compass, Zap, Heart } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const features = [
  { icon: Eye, text: "Detect potholes and road damage automatically", color: "text-blue-500" },
  { icon: MapPin, text: "Monitor traffic congestion and flow", color: "text-orange-500" },
  { icon: Shield, text: "Analyze accident risks and hotspots", color: "text-red-500" },
  { icon: Building2, text: "Assess general city infrastructure health", color: "text-purple-500" }
];

const audiences = [
  { 
    title: "Citizens", 
    description: "Safer commutes and real-time road updates.",
    icon: Users,
    gradient: "from-blue-500/20 to-cyan-500/20"
  },
  { 
    title: "Authorities", 
    description: "Data-driven maintenance and planning.",
    icon: Shield,
    gradient: "from-green-500/20 to-emerald-500/20"
  },
  { 
    title: "Planners", 
    description: "Long-term urban development insights.",
    icon: Compass,
    gradient: "from-purple-500/20 to-pink-500/20"
  }
];

const About = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navigation />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-primary/5 blur-3xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16 relative">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="inline-block mb-6"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <Brain className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
            About RDCM
          </h1>
          <motion.p 
            className="text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Road Drivability & City Monitoring Platform
          </motion.p>
        </motion.div>

        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mission Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <CardContent className="p-8 relative">
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Zap className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Our Mission</h3>
                </motion.div>
                <p className="text-muted-foreground leading-relaxed">
                  RDCM is an intelligent road-condition and urban-environment monitoring platform designed to transform how cities manage their infrastructure. By leveraging advanced AI models, we analyze real-time data from vehicles, CCTV, and mobile devices to create safer, smarter cities.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* What We Do Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-8">
                <motion.div
                  className="flex items-center gap-3 mb-6"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Heart className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">What We Do</h3>
                </motion.div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {features.map((feature, i) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={i}
                        className="flex items-start gap-3 p-4 rounded-xl bg-card/50 hover:bg-card transition-colors group/item cursor-default"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className={`p-2 rounded-lg bg-primary/10 ${feature.color}`}
                        >
                          <Icon className="w-5 h-5" />
                        </motion.div>
                        <span className="text-sm mt-1">{feature.text}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* For Everyone Section */}
          <motion.div variants={itemVariants}>
            <Card className="glass-card overflow-hidden">
              <CardContent className="p-8">
                <motion.div
                  className="flex items-center gap-3 mb-4"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Users className="w-6 h-6 text-primary" />
                  <h3 className="text-2xl font-semibold">For Everyone</h3>
                </motion.div>
                <p className="text-muted-foreground mb-6">
                  Our system provides real-time drivability scores, alerts, and dashboards tailored for:
                </p>
                
                <div className="grid sm:grid-cols-3 gap-6">
                  {audiences.map((audience, i) => {
                    const Icon = audience.icon;
                    return (
                      <motion.div 
                        key={i}
                        className={`p-5 rounded-xl bg-gradient-to-br ${audience.gradient} border border-primary/10 hover:border-primary/30 transition-all group/card`}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                      >
                        <motion.div
                          className="mb-3"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          <Icon className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h4 className="font-semibold mb-2 text-primary">{audience.title}</h4>
                        <p className="text-sm text-muted-foreground">{audience.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tech Stack or CTA */}
          <motion.div 
            variants={itemVariants}
            className="text-center pt-8"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-5 h-5 text-primary" />
              </motion.div>
              <span className="text-sm font-medium">Powered by Advanced AI & Computer Vision</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;

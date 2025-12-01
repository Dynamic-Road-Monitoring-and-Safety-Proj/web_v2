import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter, BarChart3, TrendingUp, PieChart, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const reports = [
  { 
    title: "Monthly Road Quality Assessment", 
    icon: BarChart3, 
    color: "text-blue-500",
    date: "Nov 26, 2025",
    size: "2.4 MB",
    status: "Ready"
  },
  { 
    title: "Traffic Congestion Analysis", 
    icon: TrendingUp, 
    color: "text-orange-500",
    date: "Nov 25, 2025",
    size: "1.8 MB",
    status: "Ready"
  },
  { 
    title: "Pothole Repair Efficiency", 
    icon: PieChart, 
    color: "text-green-500",
    date: "Nov 24, 2025",
    size: "3.1 MB",
    status: "Ready"
  },
  { 
    title: "Accident Hotspots Report", 
    icon: FileText, 
    color: "text-red-500",
    date: "Nov 23, 2025",
    size: "4.2 MB",
    status: "Ready"
  },
  { 
    title: "Infrastructure Maintenance Log", 
    icon: Calendar, 
    color: "text-purple-500",
    date: "Nov 22, 2025",
    size: "1.5 MB",
    status: "Processing"
  },
  { 
    title: "City-wide Drivability Score", 
    icon: TrendingUp, 
    color: "text-cyan-500",
    date: "Nov 21, 2025",
    size: "2.9 MB",
    status: "Ready"
  }
];

const Reports = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">Generate and download detailed city infrastructure reports</p>
          </div>
          <motion.div 
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" className="group">
              <Filter className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
              Filter
            </Button>
            <Button className="gradient-primary group">
              <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
              Export All
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Summary */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {[
            { label: "Total Reports", value: "156", icon: FileText },
            { label: "This Month", value: "24", icon: Calendar },
            { label: "Downloads", value: "1.2K", icon: Download },
            { label: "Avg. Gen Time", value: "2.3s", icon: Clock }
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-4 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {reports.map((report, i) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="glass-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer h-full overflow-hidden relative">
                  {/* Animated background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="relative">
                    <CardTitle className="flex items-start justify-between">
                      <span className="text-lg pr-4">{report.title}</span>
                      <motion.div
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className={`w-6 h-6 ${report.color} transition-colors`} />
                      </motion.div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground mb-4">
                      Comprehensive analysis of data collected over the last 30 days.
                    </p>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.date}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        report.status === 'Ready' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-border/50">
                      <span className="text-muted-foreground">{report.size}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary/80 group/btn"
                        disabled={report.status !== 'Ready'}
                      >
                        <Download className="w-4 h-4 mr-1 group-hover/btn:animate-bounce" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Generate New Report Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="glass-card border-dashed border-2 border-primary/30 hover:border-primary/60 transition-colors group">
            <CardContent className="p-8 text-center">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-4"
              >
                <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">Generate Custom Report</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Create a tailored report with specific date ranges, metrics, and visualization options.
              </p>
              <Button className="gradient-primary">
                Create New Report
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;

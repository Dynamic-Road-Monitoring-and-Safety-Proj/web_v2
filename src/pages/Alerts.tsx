import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Bell, Info } from "lucide-react";
import { motion } from "framer-motion";

const alerts = [
  {
    id: 1,
    type: "critical",
    title: "Severe Pothole Detected",
    location: "Sector 17, Main Road",
    time: "10 mins ago",
    status: "New",
  },
  {
    id: 2,
    type: "warning",
    title: "High Traffic Congestion",
    location: "Tribune Chowk",
    time: "25 mins ago",
    status: "Investigating",
  },
  {
    id: 3,
    type: "info",
    title: "Road Maintenance Scheduled",
    location: "Sector 35",
    time: "2 hours ago",
    status: "Scheduled",
  },
  {
    id: 4,
    type: "success",
    title: "Pothole Repaired",
    location: "Sector 22 Market",
    time: "5 hours ago",
    status: "Resolved",
  },
  {
    id: 5,
    type: "critical",
    title: "Accident Reported",
    location: "IT Park Road",
    time: "15 mins ago",
    status: "Emergency",
  },
  {
    id: 6,
    type: "warning",
    title: "Poor Road Condition",
    location: "Sector 43",
    time: "1 hour ago",
    status: "Under Review",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

const Alerts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              System Alerts
            </h1>
            <p className="text-muted-foreground">Real-time notifications and incident reports</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge variant="outline" className="px-4 py-2 text-base border-primary text-primary">
              {alerts.filter(a => a.type === 'critical').length} Critical Alerts
            </Badge>
          </motion.div>
        </motion.div>

        <motion.div 
          className="grid gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {alerts.map((alert, index) => (
            <motion.div key={alert.id} variants={item}>
              <Card className={`glass-card hover:shadow-lg transition-all duration-300 border-l-4 ${
                alert.type === 'critical' ? 'border-l-red-500' :
                alert.type === 'warning' ? 'border-l-yellow-500' :
                alert.type === 'success' ? 'border-l-green-500' :
                'border-l-blue-500'
              }`}>
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`p-3 rounded-full ${
                        alert.type === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' :
                        alert.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                      }`}
                      animate={alert.type === 'critical' ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {alert.type === 'critical' ? <AlertTriangle className="w-6 h-6" /> :
                       alert.type === 'success' ? <CheckCircle className="w-6 h-6" /> :
                       alert.type === 'warning' ? <Clock className="w-6 h-6" /> :
                       <Info className="w-6 h-6" />}
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-lg">{alert.title}</h3>
                      <p className="text-muted-foreground">{alert.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={alert.type === 'critical' ? 'destructive' : 'secondary'} 
                      className={`mb-2 ${
                        alert.type === 'success' ? 'bg-green-500 hover:bg-green-600' : ''
                      }`}
                    >
                      {alert.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{alert.time}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Alerts;

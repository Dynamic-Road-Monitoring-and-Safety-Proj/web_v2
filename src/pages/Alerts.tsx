import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, Bell, Info, Car, Route, RefreshCw, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchAllData,
  getAvailableDates,
  getTodayDateString,
  getCongestionColor,
  getDamageColor,
} from "@/lib/dynamodb";
import { CongestionItem, DamageItem } from "@/lib/types";

// Alert type derived from data
interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  location: string;
  time: string;
  status: string;
  hexId: string;
  dataType: 'congestion' | 'damage';
  severity: number;
}

// Generate alerts from congestion data
const generateCongestionAlerts = (data: CongestionItem[]): Alert[] => {
  return data.map((item) => {
    let type: Alert['type'] = 'info';
    let title = '';
    let status = '';

    switch (item.congestion_level) {
      case 'critical':
        type = 'critical';
        title = 'Critical Traffic Congestion';
        status = 'Emergency';
        break;
      case 'high':
        type = 'warning';
        title = 'High Traffic Congestion';
        status = 'Monitoring';
        break;
      case 'medium':
        type = 'info';
        title = 'Moderate Traffic Flow';
        status = 'Normal';
        break;
      default:
        type = 'success';
        title = 'Smooth Traffic Flow';
        status = 'Good';
    }

    const updatedDate = new Date(item.last_updated);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const timeAgo = diffMins < 60 
      ? `${diffMins} mins ago`
      : diffMins < 1440
        ? `${Math.floor(diffMins / 60)} hours ago`
        : `${Math.floor(diffMins / 1440)} days ago`;

    return {
      id: `congestion-${item.hex_id}`,
      type,
      title,
      location: item.road_name || `Hex ${item.hex_id.slice(0, 8)}`,
      time: timeAgo,
      status,
      hexId: item.hex_id,
      dataType: 'congestion',
      severity: item.congestion_level === 'critical' ? 100 
        : item.congestion_level === 'high' ? 75
        : item.congestion_level === 'medium' ? 50 : 25,
    };
  });
};

// Generate alerts from damage data
const generateDamageAlerts = (data: DamageItem[]): Alert[] => {
  return data.map((item) => {
    let type: Alert['type'] = 'info';
    let title = '';
    let status = '';

    switch (item.prophet_classification) {
      case 'critical':
        type = 'critical';
        title = 'Critical Road Damage Detected';
        status = 'Urgent Repair';
        break;
      case 'poor':
        type = 'warning';
        title = 'Poor Road Condition';
        status = 'Needs Attention';
        break;
      case 'moderate':
        type = 'info';
        title = 'Moderate Road Wear';
        status = 'Scheduled';
        break;
      default:
        type = 'success';
        title = 'Good Road Condition';
        status = 'Maintained';
    }

    const updatedDate = new Date(item.last_updated);
    const now = new Date();
    const diffMs = now.getTime() - updatedDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const timeAgo = diffMins < 60 
      ? `${diffMins} mins ago`
      : diffMins < 1440
        ? `${Math.floor(diffMins / 60)} hours ago`
        : `${Math.floor(diffMins / 1440)} days ago`;

    return {
      id: `damage-${item.hex_id}`,
      type,
      title,
      location: `Hex ${item.hex_id.slice(0, 8)} | Comfort: ${item.derived_metrics.ride_comfort_score.toFixed(0)}/100`,
      time: timeAgo,
      status,
      hexId: item.hex_id,
      dataType: 'damage',
      severity: item.prophet_classification === 'critical' ? 100 
        : item.prophet_classification === 'poor' ? 75
        : item.prophet_classification === 'moderate' ? 50 : 25,
    };
  });
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

const Alerts = () => {
  const [congestionData, setCongestionData] = useState<CongestionItem[]>([]);
  const [damageData, setDamageData] = useState<DamageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'congestion' | 'damage'>('all');

  const availableDates = useMemo(() => getAvailableDates(), []);

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await fetchAllData(selectedDate);
      setCongestionData(data.congestion);
      setDamageData(data.damage);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Generate and filter alerts
  const alerts = useMemo(() => {
    const congestionAlerts = generateCongestionAlerts(congestionData);
    const damageAlerts = generateDamageAlerts(damageData);
    let allAlerts = [...congestionAlerts, ...damageAlerts];

    // Sort by severity (critical first) then by time
    allAlerts.sort((a, b) => b.severity - a.severity);

    // Apply filters
    if (filterType === 'critical') {
      allAlerts = allAlerts.filter(a => a.type === 'critical');
    } else if (filterType === 'warning') {
      allAlerts = allAlerts.filter(a => a.type === 'critical' || a.type === 'warning');
    } else if (filterType === 'congestion') {
      allAlerts = allAlerts.filter(a => a.dataType === 'congestion');
    } else if (filterType === 'damage') {
      allAlerts = allAlerts.filter(a => a.dataType === 'damage');
    }

    return allAlerts;
  }, [congestionData, damageData, filterType]);

  const criticalCount = alerts.filter(a => a.type === 'critical').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <motion.div 
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-primary" />
              System Alerts
            </h1>
            <p className="text-muted-foreground">Real-time alerts from DynamoDB • H3 Hex Data</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Selector */}
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Type */}
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning+</SelectItem>
                <SelectItem value="congestion">Traffic Only</SelectItem>
                <SelectItem value="damage">Road Quality</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh */}
            <Button 
              variant="outline" 
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Critical Badge */}
            {criticalCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge variant="destructive" className="px-4 py-2 text-base">
                  {criticalCount} Critical
                </Badge>
              </motion.div>
            )}
          </div>
        </motion.div>

        {alerts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-muted-foreground">No alerts matching your filters for this date.</p>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            className="grid gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {alerts.map((alert) => (
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{alert.title}</h3>
                          {alert.dataType === 'congestion' ? (
                            <Car className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Route className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-muted-foreground">{alert.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={alert.type === 'critical' ? 'destructive' : 'secondary'} 
                        className={`mb-2 ${
                          alert.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' : ''
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
        )}
      </div>
    </div>
  );
};

export default Alerts;

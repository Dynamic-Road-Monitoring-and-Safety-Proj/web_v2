import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

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
];

const Alerts = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">System Alerts</h1>
            <p className="text-muted-foreground">Real-time notifications and incident reports</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-base">
            {alerts.length} Active Alerts
          </Badge>
        </div>

        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="glass-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    alert.type === 'success' ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {alert.type === 'critical' ? <AlertTriangle className="w-6 h-6" /> :
                     alert.type === 'success' ? <CheckCircle className="w-6 h-6" /> :
                     <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{alert.title}</h3>
                    <p className="text-muted-foreground">{alert.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'} className="mb-2">
                    {alert.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{alert.time}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Alerts;

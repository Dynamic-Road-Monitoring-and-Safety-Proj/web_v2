import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Filter } from "lucide-react";

const Reports = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate and download detailed city infrastructure reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button className="gradient-primary">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            "Monthly Road Quality Assessment",
            "Traffic Congestion Analysis",
            "Pothole Repair Efficiency",
            "Accident Hotspots Report",
            "Infrastructure Maintenance Log",
            "City-wide Drivability Score"
          ].map((report, i) => (
            <Card key={i} className="glass-card hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{report}</span>
                  <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive analysis of data collected over the last 30 days.
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Generated: Nov 26, 2025</span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;

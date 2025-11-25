import { Layers, Video, Calendar, Users, FileJson, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Layers,
    title: "Multi-Layer Maps",
    description: "Toggle between pothole hotspots, road bumps, AQI heatmaps, traffic flow, and camera footprints. All data synchronized in real-time.",
    items: ["Pothole & bump detection", "AQI heatmap overlay", "Traffic density visualization", "Camera path tracking"],
  },
  {
    icon: Video,
    title: "Annotated Video Player",
    description: "Frame-accurate playback with bounding boxes, confidence scores, and sensor telemetry overlays. Export any frame with annotations.",
    items: ["Per-frame detections", "Vehicle tracking", "Sensor data overlay", "COCO/YOLO export"],
  },
  {
    icon: Calendar,
    title: "Timeline & Filters",
    description: "Navigate through historical data with time-lapse playback. Filter by severity, location, validation score, and traffic level.",
    items: ["Time-based playback", "Severity filtering", "Location search", "Date range selection"],
  },
  {
    icon: Users,
    title: "Crew Management",
    description: "Assign events to maintenance crews, track progress, and generate work orders with priority scheduling.",
    items: ["Work assignment", "Progress tracking", "Priority routing", "Completion reports"],
  },
  {
    icon: FileJson,
    title: "Data Export",
    description: "Export events, reports, and video annotations in multiple formats for integration with existing systems.",
    items: ["GeoJSON/CSV export", "PDF reports", "Video annotations", "API integration"],
  },
  {
    icon: Cloud,
    title: "Flexible Deployment",
    description: "Cloud, on-premise, or air-gapped deployment options. Enterprise-grade security and compliance built-in.",
    items: ["Cloud or on-prem", "End-to-end encryption", "SOC 2 compliant", "Air-gapped option"],
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Powerful features for{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              complete control
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to detect, analyze, and act on road safety data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass-card border-border/50 hover:shadow-glow transition-all duration-300 group hover:-translate-y-1"
            >
              <CardContent className="p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2 pt-2">
                    {feature.items.map((item, i) => (
                      <li key={i} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

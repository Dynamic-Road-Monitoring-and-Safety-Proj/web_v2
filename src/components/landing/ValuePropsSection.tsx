import { Activity, MapPin, Video, BarChart3, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Activity,
    title: "Real-time Detection",
    description: "Instant pothole and road hazard detection using advanced computer vision and sensor fusion.",
    metric: "< 2s latency",
  },
  {
    icon: MapPin,
    title: "Prioritized Maintenance",
    description: "Smart severity scoring helps teams focus on critical issues first, optimizing resource allocation.",
    metric: "3x faster response",
  },
  {
    icon: Video,
    title: "Actionable Video + Annotations",
    description: "Frame-accurate bounding boxes, confidence scores, and sensor telemetry for every detection.",
    metric: "92% accuracy",
  },
  {
    icon: BarChart3,
    title: "Multi-Layer Analytics",
    description: "Combine road quality, traffic density, and air quality data in one powerful dashboard.",
    metric: "5+ data layers",
  },
  {
    icon: Clock,
    title: "Historical Insights",
    description: "Track road degradation over time and predict maintenance needs before they become critical.",
    metric: "6 months history",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "On-premise deployment options, end-to-end encryption, and compliance with local regulations.",
    metric: "SOC 2 compliant",
  },
];

export const ValuePropsSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              monitor roads
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your city's road infrastructure with AI-powered detection, 
            real-time analytics, and actionable insights.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="glass-card border-border/50 hover:shadow-glow transition-all duration-300 group hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:shadow-glow transition-all">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {feature.metric}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

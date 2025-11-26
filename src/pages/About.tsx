import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About RDCM</h1>
          <p className="text-xl text-muted-foreground">
            Road Drivability & City Monitoring Platform
          </p>
        </div>

        <div className="space-y-8">
          <Card className="glass-card">
            <CardContent className="p-8 prose dark:prose-invert max-w-none">
              <h3>Our Mission</h3>
              <p>
                RDCM is an intelligent road-condition and urban-environment monitoring platform designed to transform how cities manage their infrastructure. By leveraging advanced AI models, we analyze real-time data from vehicles, CCTV, and mobile devices to create safer, smarter cities.
              </p>

              <h3>What We Do</h3>
              <ul className="grid sm:grid-cols-2 gap-4 list-none pl-0">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Detect potholes and road damage automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Monitor traffic congestion and flow</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Analyze accident risks and hotspots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Assess general city infrastructure health</span>
                </li>
              </ul>

              <h3>For Everyone</h3>
              <p>
                Our system provides real-time drivability scores, alerts, and dashboards tailored for:
              </p>
              <div className="grid sm:grid-cols-3 gap-6 not-prose mt-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="font-semibold mb-2 text-primary">Citizens</h4>
                  <p className="text-sm text-muted-foreground">Safer commutes and real-time road updates.</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="font-semibold mb-2 text-primary">Authorities</h4>
                  <p className="text-sm text-muted-foreground">Data-driven maintenance and planning.</p>
                </div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <h4 className="font-semibold mb-2 text-primary">Planners</h4>
                  <p className="text-sm text-muted-foreground">Long-term urban development insights.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;

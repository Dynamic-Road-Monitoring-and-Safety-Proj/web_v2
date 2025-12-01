import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { ValuePropsSection } from "@/components/landing/ValuePropsSection";
import { DemoPreviewSection } from "@/components/landing/DemoPreviewSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <ValuePropsSection />
      <DemoPreviewSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Landing;

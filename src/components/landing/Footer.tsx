import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                RDCM
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Road Drivability & City Monitoring. Making roads safer with AI-powered detection.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/docs" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="/api-spec" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Specification
                </a>
              </li>
              <li>
                <a 
                  href="/data-sample" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sample Data
                </a>
              </li>
              <li>
                <Link to="#case-studies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Case Studies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Get in Touch</h3>
            <p className="text-sm text-muted-foreground">
              Ready to make your city's roads safer?
            </p>
            <Button className="w-full gradient-primary shadow-glow">
              Request Demo
            </Button>
            <p className="text-xs text-muted-foreground">
              support@rdcm.tech<br />
              +91 172 123 4567
            </p>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 RDCM. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="#terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link to="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

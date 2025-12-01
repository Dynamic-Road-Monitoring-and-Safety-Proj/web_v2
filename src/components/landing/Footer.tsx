import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, ExternalLink, ArrowUpRight } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Features", to: "#features" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Integrations", to: "#integrations" },
    { label: "Pricing", to: "#pricing" },
  ],
  resources: [
    { label: "Documentation", href: "/docs", external: true },
    { label: "API Specification", href: "/api-spec", external: true },
    { label: "Sample Data", href: "/data-sample", external: true },
    { label: "Case Studies", to: "#case-studies" },
  ],
  legal: [
    { label: "Privacy Policy", to: "#privacy" },
    { label: "Terms of Service", to: "#terms" },
    { label: "Security", to: "#security" },
  ],
};

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/50 relative overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ 
            x: [0, 30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-secondary/10 blur-3xl"
          animate={{ 
            x: [0, -30, 0], 
            y: [0, -20, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Brand */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link to="/" className="inline-block group">
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-white font-bold text-xl">R</span>
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  RDCM
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Road Drivability & City Monitoring. Making roads safer with AI-powered detection.
            </p>
            
            {/* Contact info */}
            <div className="space-y-2 pt-2">
              <motion.a 
                href="mailto:support@rdcm.tech" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                whileHover={{ x: 3 }}
              >
                <Mail className="w-4 h-4 group-hover:text-primary transition-colors" />
                support@rdcm.tech
              </motion.a>
              <motion.a 
                href="tel:+911721234567" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                whileHover={{ x: 3 }}
              >
                <Phone className="w-4 h-4 group-hover:text-primary transition-colors" />
                +91 172 123 4567
              </motion.a>
              <motion.div 
                className="flex items-center gap-2 text-sm text-muted-foreground"
                whileHover={{ x: 3 }}
              >
                <MapPin className="w-4 h-4" />
                Chandigarh, India
              </motion.div>
            </div>
          </motion.div>

          {/* Product */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link, i) => (
                <motion.li 
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={link.to} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link, i) => (
                <motion.li 
                  key={i}
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.external ? (
                    <a 
                      href={link.href} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <Link 
                      to={link.to!} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="font-semibold">Get in Touch</h3>
            <p className="text-sm text-muted-foreground">
              Ready to make your city's roads safer?
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="w-full gradient-primary shadow-glow group">
                Request Demo
                <motion.span
                  className="ml-2"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Button>
            </motion.div>
            
            {/* Social links placeholder */}
            <div className="flex gap-3 pt-2">
              {["Twitter", "LinkedIn", "GitHub"].map((social, i) => (
                <motion.a
                  key={social}
                  href={`#${social.toLowerCase()}`}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-16 pt-8 border-t border-border/50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 RDCM. All rights reserved.
            </p>
            <div className="flex gap-6">
              {footerLinks.legal.map((link, i) => (
                <motion.div key={i} whileHover={{ y: -2 }}>
                  <Link 
                    to={link.to} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

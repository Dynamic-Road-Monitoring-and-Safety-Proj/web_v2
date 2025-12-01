import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientMeterProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  showValue?: boolean;
}

export const GradientMeter = ({ 
  value, 
  max = 10, 
  label, 
  className,
  showValue = true
}: GradientMeterProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Calculate color based on value (green to yellow to red)
  const getColor = () => {
    if (percentage <= 33) return "from-green-500 to-green-400";
    if (percentage <= 66) return "from-yellow-500 to-orange-400";
    return "from-orange-500 to-red-500";
  };

  const getTextColor = () => {
    if (percentage <= 33) return "text-green-500";
    if (percentage <= 66) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium text-muted-foreground">{label}</span>}
          {showValue && (
            <span className={cn("font-bold", getTextColor())}>
              {value.toFixed(1)} / {max}
            </span>
          )}
        </div>
      )}
      <div className="relative h-4 w-full bg-secondary/20 rounded-full overflow-hidden">
        {/* Gradient background showing full scale */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-20" />
        
        {/* Animated fill */}
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="w-0.5 h-2 bg-white/30 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Good</span>
        <span>Moderate</span>
        <span>Critical</span>
      </div>
    </div>
  );
};

interface SemiCircleMeterProps {
  value: number;
  max?: number;
  label?: string;
  size?: number;
  className?: string;
}

export const SemiCircleMeter = ({
  value,
  max = 10,
  label,
  size = 200,
  className,
}: SemiCircleMeterProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const angle = (percentage / 100) * 180;
  
  // Calculate color based on value
  const getColor = () => {
    if (percentage <= 33) return "#22c55e"; // green
    if (percentage <= 66) return "#eab308"; // yellow
    return "#ef4444"; // red
  };

  const getStatus = () => {
    if (percentage <= 33) return "Good";
    if (percentage <= 66) return "Moderate";
    return "Critical";
  };

  const radius = size / 2 - 20;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (angle / 180) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size / 2 + 30} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${20} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={12}
          className="text-secondary/20"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        
        {/* Progress arc */}
        <motion.path
          d={`M ${20} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
          fill="none"
          stroke="url(#meterGradient)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        {/* Needle */}
        <motion.g
          initial={{ rotate: -90 }}
          animate={{ rotate: angle - 90 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          <line
            x1={size / 2}
            y1={size / 2}
            x2={size / 2}
            y2={30}
            stroke={getColor()}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={size / 2} cy={size / 2} r={8} fill={getColor()} />
        </motion.g>
        
        {/* Value text */}
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          className="text-3xl font-bold fill-current"
        >
          {value.toFixed(1)}
        </text>
      </svg>
      
      {label && (
        <div className="text-center mt-2">
          <div className="text-sm font-medium text-muted-foreground">{label}</div>
          <div className={cn("text-sm font-bold", {
            "text-green-500": percentage <= 33,
            "text-yellow-500": percentage > 33 && percentage <= 66,
            "text-red-500": percentage > 66,
          })}>
            {getStatus()}
          </div>
        </div>
      )}
    </div>
  );
};

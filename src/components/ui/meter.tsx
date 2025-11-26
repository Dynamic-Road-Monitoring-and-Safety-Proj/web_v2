import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MeterProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
  color?: string;
}

export const Meter = ({ value, max = 100, label, className, color = "bg-primary" }: MeterProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-xs">
          <span className="font-medium text-muted-foreground">{label}</span>
          <span className="font-bold">{value.toFixed(1)}</span>
        </div>
      )}
      <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

interface RadialProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  subLabel?: string;
  color?: string;
  className?: string;
}

export const RadialProgress = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label,
  subLabel,
  color = "text-primary",
  className,
}: RadialProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-secondary/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold">{value}</span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
      {subLabel && <div className="mt-2 text-xs text-muted-foreground">{subLabel}</div>}
    </div>
  );
};

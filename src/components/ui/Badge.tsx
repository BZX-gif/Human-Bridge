import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "blue" | "green" | "yellow" | "red" | "purple" | "outline" | "ghost";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-[#e8edff] text-[#1a56ff]",
  green: "bg-green-50 text-green-700",
  yellow: "bg-yellow-50 text-yellow-700",
  red: "bg-red-50 text-red-700",
  purple: "bg-purple-50 text-purple-700",
  outline: "border border-slate-200 text-slate-600 bg-transparent",
  ghost: "text-slate-500 bg-transparent",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] font-medium",
  md: "px-2.5 py-1 text-xs font-medium",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full", variantClasses[variant], sizeClasses[size], className)}>
      {children}
    </span>
  );
}

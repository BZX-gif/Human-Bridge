import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "purple"
  | "outline"
  | "ghost"
  | "dark";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-paper-3 text-graphite border border-transparent",
  blue: "bg-paper-3 text-ink border border-line",
  green: "bg-moss-soft text-moss border border-moss/15",
  yellow: "bg-ochre-soft text-ochre border border-ochre/15",
  red: "bg-rust-soft text-rust border border-rust/15",
  purple: "bg-paper-3 text-graphite border border-line",
  outline: "border border-line-strong text-graphite bg-transparent",
  ghost: "text-muted bg-transparent",
  dark: "bg-ink text-paper border border-ink",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10.5px] font-medium",
  md: "px-2.5 py-1 text-[11.5px] font-medium",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[4px] tracking-[0.01em]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

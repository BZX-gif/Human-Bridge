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
  default: "bg-paper-3 text-graphite",
  blue: "bg-accent-soft text-link",
  green: "bg-moss-soft text-moss",
  yellow: "bg-ochre-soft text-ochre",
  red: "bg-rust-soft text-rust",
  purple: "bg-paper-3 text-graphite",
  outline: "bg-transparent text-graphite ring-1 ring-inset ring-line-strong",
  ghost: "bg-transparent text-muted",
  dark: "bg-ink text-paper",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-2xs",
  md: "px-2.5 py-[3px] text-2xs",
};

export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

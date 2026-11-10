import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-paper border border-ink hover:bg-graphite hover:border-graphite active:translate-y-px disabled:bg-line-strong disabled:border-line-strong disabled:text-muted disabled:active:translate-y-0",
  secondary:
    "bg-paper text-graphite border border-line-strong hover:border-graphite hover:text-ink active:translate-y-px disabled:text-faint disabled:hover:border-line-strong",
  ghost:
    "bg-transparent text-graphite border border-transparent hover:bg-paper-3 hover:text-ink disabled:text-faint",
  danger:
    "bg-rust text-paper border border-rust hover:bg-rust-700 active:translate-y-px disabled:bg-rust-soft disabled:text-rust",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12px] gap-1.5",
  md: "h-10 px-4 text-[13px] gap-2",
  lg: "h-12 px-6 text-[14px] gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-[background-color,border-color,color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

interface ButtonLinkProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  target?: string;
  rel?: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  target,
  rel,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}

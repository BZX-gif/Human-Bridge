import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

/**
 * Pill buttons. One filled accent action per view; everything else is quiet.
 * The 1px transparent border keeps every variant the same size, so call sites
 * that restyle a button for a dark surface (`border-paper bg-paper …`) fit.
 */
const variants: Record<Variant, string> = {
  primary:
    "border-transparent bg-accent text-white hover:bg-accent-hover active:bg-accent-press",
  secondary:
    "border-transparent bg-paper-3 text-ink hover:bg-paper-4",
  ghost:
    "border-transparent bg-transparent text-graphite hover:bg-ink/[0.06] hover:text-ink",
  danger:
    "border-transparent bg-rust text-white hover:bg-rust-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3.5 text-xs",
  md: "h-10 gap-2 px-[18px] text-sm",
  lg: "h-12 gap-2 px-7 text-base",
};

const base =
  "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full border font-medium transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-apple active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

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

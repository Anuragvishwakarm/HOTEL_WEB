"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variants = {
  primary:   "bg-navy-900 text-white hover:bg-navy-950 focus:ring-navy-900/30",
  secondary: "bg-white text-navy-900 border border-surface-200 hover:bg-surface-50 focus:ring-navy-900/20",
  gold:      "bg-gold-500 text-white hover:bg-gold-600 focus:ring-gold-500/30",
  ghost:     "bg-transparent text-navy-900 hover:bg-surface-50 focus:ring-navy-900/10",
  danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/30",
};
const sizes = {
  sm:  "h-8  px-3 text-sm rounded-lg",
  md:  "h-11 px-5 text-sm rounded-xl",
  lg:  "h-13 px-7 text-base rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, fullWidth, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
        "focus:outline-none focus:ring-2 active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant], sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export default Button;

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "navy";
  className?: string;
}
const variants = {
  default: "bg-surface-100 text-surface-400 border-surface-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-red-700 border-red-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  navy:    "bg-navy-50 text-navy-900 border-navy-200",
};
export default function Badge({ children, variant = "default", className }: Props) {
  return (
    <span className={cn("badge", variants[variant], className)}>{children}</span>
  );
}

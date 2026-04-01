import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  title:      string;
  value:      string;
  subtitle?:  string;
  icon?:      ReactNode;
  trend?:     { value: string; positive: boolean };
  accent?:    "navy" | "gold" | "green" | "red" | "blue";
  className?: string;
}

const accents = {
  navy:  { bg: "bg-navy-50",   text: "text-navy-900",  border: "border-navy-200",  bar: "bg-navy-900"  },
  gold:  { bg: "bg-gold-50",   text: "text-gold-700",  border: "border-gold-200",  bar: "bg-gold-500"  },
  green: { bg: "bg-emerald-50",text: "text-emerald-700",border:"border-emerald-200",bar:"bg-emerald-500"},
  red:   { bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200",   bar: "bg-red-500"   },
  blue:  { bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200",  bar: "bg-blue-500"  },
};

export default function StatsCard({ title, value, subtitle, icon, trend, accent = "navy", className }: Props) {
  const a = accents[accent];
  return (
    <div className={cn("card relative overflow-hidden", className)}>
      <div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl", a.bar)} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-surface-400">{title}</p>
        {icon && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", a.bg, "border", a.border)}>
            <span className={cn("text-base", a.text)}>{icon}</span>
          </div>
        )}
      </div>
      <p className={cn("font-display font-extrabold text-2xl mb-1", a.text)}>{value}</p>
      {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
      {trend && (
        <p className={cn("text-xs font-medium mt-2", trend.positive ? "text-emerald-600" : "text-red-500")}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  );
}

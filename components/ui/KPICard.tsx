import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

interface Props {
  title:    string;
  value:    string | number;
  subtitle?: string;
  icon:     ReactNode;
  accent?:  string;
  trend?:   { value: string; up: boolean };
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function KPICard({ title, value, subtitle, icon, accent = "bg-navy-50 text-navy-700", trend, loading, onClick, className }: Props) {
  return (
    <div
      className={cn(
        "card p-5 flex flex-col gap-3",
        onClick && "cursor-pointer hover:shadow-float transition-all duration-200 hover:-translate-y-0.5",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm text-surface-400 font-medium">{title}</p>
        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base", accent)}>
          {icon}
        </span>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3 w-20" />
        </>
      ) : (
        <>
          <p className="font-display text-3xl font-extrabold text-navy-900 leading-none">{value}</p>
          <div className="flex items-center gap-2">
            {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
            {trend && (
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                trend.up ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              )}>
                {trend.up ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

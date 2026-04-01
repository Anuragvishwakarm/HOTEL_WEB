import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Crumb { label: string; href?: string; }

interface Props {
  title:       string;
  subtitle?:   string;
  breadcrumbs?: Crumb[];
  actions?:    ReactNode;
  className?:  string;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions, className }: Props) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
      <div>
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-sm text-surface-400 mb-2">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-navy-900 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-navy-900 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-display text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-surface-400 mt-1 text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

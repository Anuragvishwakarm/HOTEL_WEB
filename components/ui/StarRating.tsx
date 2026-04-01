import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { rating: number; size?: "sm" | "md"; className?: string; }

export default function StarRating({ rating, size = "sm", className }: Props) {
  const sz = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          className={cn(sz, i <= rating ? "fill-gold-400 text-gold-400" : "fill-surface-200 text-surface-200")}
        />
      ))}
    </span>
  );
}

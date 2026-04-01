import { cn, getStatusColor, getRoomStatusColor } from "@/lib/utils";

interface BookingStatusProps { status: string; className?: string; }
export function BookingStatusBadge({ status, className }: BookingStatusProps) {
  return (
    <span className={cn("badge capitalize", getStatusColor(status), className)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

interface RoomStatusProps { status: string; showDot?: boolean; className?: string; }
export function RoomStatusBadge({ status, showDot = true, className }: RoomStatusProps) {
  const colorMap: Record<string, string> = {
    available:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    occupied:    "bg-red-50    text-red-700    border-red-200",
    cleaning:    "bg-amber-50  text-amber-700  border-amber-200",
    maintenance: "bg-orange-50 text-orange-700 border-orange-200",
    blocked:     "bg-gray-50   text-gray-600   border-gray-200",
    inspecting:  "bg-blue-50   text-blue-700   border-blue-200",
  };
  const dotMap: Record<string, string> = {
    available:   "bg-emerald-500",
    occupied:    "bg-red-500",
    cleaning:    "bg-amber-500",
    maintenance: "bg-orange-500",
    blocked:     "bg-gray-400",
    inspecting:  "bg-blue-500",
  };
  return (
    <span className={cn("badge capitalize", colorMap[status] || "bg-gray-50 text-gray-600 border-gray-200", className)}>
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotMap[status] || "bg-gray-400")} />}
      {status.replace(/_/g, " ")}
    </span>
  );
}

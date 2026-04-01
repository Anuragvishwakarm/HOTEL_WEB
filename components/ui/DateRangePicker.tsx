"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m+1)}-${pad(d)}`; }
function parseISO(iso: string) {
  const [y,m,d] = iso.split("-").map(Number);
  return new Date(y, m-1, d);
}
function fmtDisplay(iso: string) {
  if (!iso) return "";
  const d = parseISO(iso);
  return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month+1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a: string, b: string) { return a === b; }
function isBefore(a: string, b: string) { return a < b; }
function isAfter(a: string, b: string)  { return a > b; }
function isInRange(iso: string, start: string, end: string) {
  return iso > start && iso < end;
}

interface Props {
  checkIn:      string;
  checkOut:     string;
  onSelect:     (ci: string, co: string) => void;
  placeholder?: string;
}

export default function DateRangePicker({ checkIn, checkOut, onSelect, placeholder="Check-in — Check-out" }: Props) {
  const today = (() => {
    const d = new Date();
    return toISO(d.getFullYear(), d.getMonth(), d.getDate());
  })();

  const [open,      setOpen]      = useState(false);
  const [tab,       setTab]       = useState<"calendar"|"flexible">("calendar");
  const [hovered,   setHovered]   = useState<string | null>(null);
  const [selecting, setSelecting] = useState<"in"|"out">("in"); // which end we're picking
  const [flexDur,   setFlexDur]   = useState<"weekend"|"week"|"month"|"other">("week");
  const [flexMonths,setFlexMonths]= useState<string[]>([]);

  // Left month display
  const todayDate = new Date();
  const [leftYear,  setLeftYear]  = useState(todayDate.getFullYear());
  const [leftMonth, setLeftMonth] = useState(todayDate.getMonth());

  const rightYear  = leftMonth === 11 ? leftYear + 1 : leftYear;
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Reset selecting state when opening
  function handleOpen() {
    setOpen(v => !v);
    setSelecting(checkIn && !checkOut ? "out" : "in");
  }

  function handleDayClick(iso: string) {
    if (isBefore(iso, today)) return; // past — disabled

    if (selecting === "in") {
      onSelect(iso, "");
      setSelecting("out");
    } else {
      if (isBefore(iso, checkIn) || isSameDay(iso, checkIn)) {
        // clicked before/on check-in → restart
        onSelect(iso, "");
        setSelecting("out");
      } else {
        onSelect(checkIn, iso);
        setSelecting("in");
        setOpen(false);
      }
    }
  }

  function prevMonth() {
    if (leftMonth === 0) { setLeftYear(y => y-1); setLeftMonth(11); }
    else setLeftMonth(m => m-1);
  }
  function nextMonth() {
    if (leftMonth === 11) { setLeftYear(y => y+1); setLeftMonth(0); }
    else setLeftMonth(m => m+1);
  }

  const displayStr = checkIn && checkOut
    ? `${fmtDisplay(checkIn)} — ${fmtDisplay(checkOut)}`
    : checkIn
    ? `${fmtDisplay(checkIn)} — Check-out`
    : placeholder;

  // ── Flexible months ──────────────────────────────────────────────────────────
  const flexMonthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() + i, 1);
    return {
      key:   `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      year:  String(d.getFullYear()),
    };
  });

  function applyFlexible() {
    if (flexMonths.length === 0) return;
    const [yk, mk] = flexMonths[0].split("-").map(Number);
    const dur = flexDur === "weekend" ? 2 : flexDur === "week" ? 7 : flexDur === "month" ? 30 : 5;
    const ci = toISO(yk, mk, 1);
    const co = toISO(yk, mk, Math.min(dur, daysInMonth(yk, mk)));
    onSelect(ci, co);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 text-left"
      >
        <Calendar className="w-5 h-5 text-surface-400 shrink-0" />
        <span className={cn("text-sm font-medium flex-1", checkIn ? "text-navy-900" : "text-surface-400")}>
          {displayStr}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 z-[100] mt-2 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-surface-100 w-[700px] max-w-[98vw]">

          {/* Tabs */}
          <div className="flex border-b border-surface-100">
            {(["calendar", "flexible"] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-3 text-sm font-semibold transition-colors capitalize",
                  tab === t
                    ? "text-[#0071c2] border-b-2 border-[#0071c2]"
                    : "text-surface-400 hover:text-navy-900"
                )}
              >
                {t === "calendar" ? "Calendar" : "I'm flexible"}
              </button>
            ))}
          </div>

          {/* ── Calendar tab ──────────────────────────────────────────────── */}
          {tab === "calendar" && (
            <div className="p-4">
              {/* Prompt */}
              <p className="text-center text-sm text-surface-400 mb-3">
                {selecting === "in"
                  ? "Select your check-in date"
                  : "Select your check-out date"}
              </p>

              <div className="flex items-center justify-between mb-4 px-2">
                <button type="button" onClick={prevMonth}
                  className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4 text-navy-900" />
                </button>
                <div className="flex gap-12">
                  <span className="font-bold text-navy-900">{MONTHS[leftMonth]} {leftYear}</span>
                  <span className="font-bold text-navy-900">{MONTHS[rightMonth]} {rightYear}</span>
                </div>
                <button type="button" onClick={nextMonth}
                  className="w-8 h-8 rounded-full hover:bg-surface-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-navy-900" />
                </button>
              </div>

              {/* Two month grids */}
              <div className="grid grid-cols-2 gap-6">
                {[[leftYear, leftMonth], [rightYear, rightMonth]].map(([year, month]) => {
                  const totalDays = daysInMonth(year, month);
                  const firstDay  = firstDayOfMonth(year, month);
                  const cells: (string|null)[] = [
                    ...Array(firstDay).fill(null),
                    ...Array.from({ length: totalDays }, (_, i) => toISO(year, month, i+1)),
                  ];

                  return (
                    <div key={`${year}-${month}`}>
                      {/* Day headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {DAYS.map(d => (
                          <div key={d} className="text-center text-[11px] font-semibold text-surface-400 py-1">{d}</div>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7">
                        {cells.map((iso, idx) => {
                          if (!iso) return <div key={`e${idx}`} />;

                          const isPast      = isBefore(iso, today);
                          const isToday     = iso === today;
                          const isStart     = checkIn  && isSameDay(iso, checkIn);
                          const isEnd       = checkOut && isSameDay(iso, checkOut);
                          const inRange     = checkIn && checkOut && isInRange(iso, checkIn, checkOut);
                          const isHovRange  = checkIn && !checkOut && hovered && iso > checkIn && iso <= hovered;

                          return (
                            <div
                              key={iso}
                              className={cn(
                                "relative text-center",
                                (inRange || isHovRange) && "bg-blue-50",
                                isStart && checkOut && "rounded-l-full bg-blue-50",
                                isEnd   && checkIn  && "rounded-r-full bg-blue-50",
                              )}
                            >
                              <button
                                type="button"
                                disabled={isPast}
                                onClick={() => handleDayClick(iso)}
                                onMouseEnter={() => setHovered(iso)}
                                onMouseLeave={() => setHovered(null)}
                                className={cn(
                                  "w-8 h-8 mx-auto text-sm rounded-full flex items-center justify-center transition-all",
                                  isPast  && "text-surface-200 cursor-not-allowed",
                                  !isPast && !isStart && !isEnd && "hover:bg-[#0071c2] hover:text-white",
                                  isToday && !isStart && !isEnd && "font-bold text-[#0071c2]",
                                  (isStart || isEnd) && "bg-[#0071c2] text-white font-bold",
                                  inRange && !isStart && !isEnd && "text-navy-900",
                                )}
                              >
                                {new Date(iso + "T00:00:00").getDate()}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick select chips */}
              <div className="flex flex-wrap gap-2 justify-center mt-5 pt-4 border-t border-surface-100">
                {[
                  { label: "Exact dates", days: 0 },
                  { label: "+ 1 day",  days: 1 },
                  { label: "+ 2 days", days: 2 },
                  { label: "+ 3 days", days: 3 },
                  { label: "+ 7 days", days: 7 },
                ].map(({ label, days }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (checkIn) {
                        const ci = parseISO(checkIn);
                        ci.setDate(ci.getDate() + days + 1);
                        onSelect(checkIn, toISO(ci.getFullYear(), ci.getMonth(), ci.getDate()));
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "px-4 py-1.5 rounded-full border text-xs font-semibold transition-colors",
                      days === 0
                        ? "border-[#0071c2] bg-[#0071c2]/10 text-[#0071c2]"
                        : "border-surface-200 text-surface-400 hover:border-[#0071c2] hover:text-[#0071c2]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Flexible tab ──────────────────────────────────────────────── */}
          {tab === "flexible" && (
            <div className="p-6 space-y-6">
              <div>
                <p className="font-semibold text-navy-900 mb-3">How long do you want to stay?</p>
                <div className="flex flex-wrap gap-3">
                  {(["weekend","week","month","other"] as const).map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => setFlexDur(d)}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                          flexDur === d ? "border-[#0071c2]" : "border-surface-300"
                        )}
                      >
                        {flexDur === d && <div className="w-2.5 h-2.5 rounded-full bg-[#0071c2]" />}
                      </div>
                      <span className="text-sm font-medium text-navy-900 capitalize">
                        {d === "weekend" ? "A weekend" : d === "week" ? "A week" : d === "month" ? "A month" : "Other"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-semibold text-navy-900 mb-1">When do you want to go?</p>
                <p className="text-xs text-surface-400 mb-3">Select up to 3 months</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {flexMonthOptions.map(({ key, label, year }) => {
                    const selected = flexMonths.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFlexMonths(prev =>
                          prev.includes(key)
                            ? prev.filter(k => k !== key)
                            : prev.length < 3 ? [...prev, key] : prev
                        )}
                        className={cn(
                          "flex flex-col items-center px-5 py-3 rounded-xl border-2 transition-all shrink-0",
                          selected
                            ? "border-[#0071c2] bg-[#0071c2]/10"
                            : "border-surface-200 hover:border-[#0071c2]/50"
                        )}
                      >
                        <Calendar className={cn("w-5 h-5 mb-1", selected ? "text-[#0071c2]" : "text-surface-400")} />
                        <span className={cn("font-bold text-sm", selected ? "text-[#0071c2]" : "text-navy-900")}>{label}</span>
                        <span className="text-xs text-surface-400">{year}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-surface-100">
                <p className="text-sm text-surface-400">
                  {flexMonths.length > 0 && flexDur
                    ? `${flexDur === "weekend" ? "A weekend" : flexDur === "week" ? "A week" : flexDur === "month" ? "A month" : "5 nights"} in ${
                        flexMonthOptions.filter(o => flexMonths.includes(o.key)).map(o => o.label).join(", ")
                      }`
                    : "Select duration and month"
                  }
                </p>
                <button
                  type="button"
                  disabled={flexMonths.length === 0}
                  onClick={applyFlexible}
                  className="bg-[#0071c2] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#005999] transition-colors disabled:opacity-40"
                >
                  Select dates
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
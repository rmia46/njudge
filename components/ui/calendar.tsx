"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<"days" | "years">("days");
  
  // Track month locally to support year switching
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    props.month || props.defaultMonth || new Date()
  );

  const handleYearClick = () => {
    setView(view === "years" ? "days" : "years");
  };

  const selectYear = (year: number) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year);
    setCurrentMonth(newDate);
    setView("days");
  };

  // Range for year selector
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const start = currentYear - 10;
    const end = currentYear + 20;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, []);

  const yearGridRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (view === "years" && yearGridRef.current) {
      const selectedYear = currentMonth.getFullYear();
      const yearElement = yearGridRef.current.querySelector(`[data-year="${selectedYear}"]`);
      if (yearElement) {
        yearElement.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, [view, currentMonth]);

  return (
    <div className={cn("relative bg-card rounded-xl border-2 shadow-xl", className)}>
      {view === "years" ? (
        <div className="p-4 w-[280px]">
           <div className="flex items-center justify-between mb-4 border-b pb-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Select Year</span>
              <button 
                onClick={() => setView("days")}
                className="text-[10px] font-black text-primary hover:underline uppercase"
              >
                Back
              </button>
           </div>
           <div 
            ref={yearGridRef}
            className="grid grid-cols-3 gap-2 h-[240px] overflow-y-auto pr-1 custom-scrollbar"
           >
              {years.map((y) => (
                <button
                  key={y}
                  data-year={y}
                  onClick={() => selectYear(y)}
                  className={cn(
                    "h-10 flex items-center justify-center text-xs font-bold rounded-lg transition-all",
                    y === currentMonth.getFullYear() 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {y}
                </button>
              ))}
           </div>
        </div>
      ) : (
        <DayPicker
          showOutsideDays={showOutsideDays}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="p-4"
          classNames={{
            months: "flex flex-col sm:flex-row gap-4",
            month: "space-y-4 relative",
            month_caption: "flex justify-center items-center h-10 relative mb-2 w-full mt-0",
            caption_label: "hidden", 
            nav: "absolute top-0 left-0 right-0 h-10 flex items-center justify-between z-20 pointer-events-none",
            button_previous: cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7 bg-background p-0 opacity-100 border-2 hover:border-primary hover:bg-primary/5 pointer-events-auto transition-all rounded-md"
            ),
            button_next: cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7 bg-background p-0 opacity-100 border-2 hover:border-primary hover:bg-primary/5 pointer-events-auto transition-all rounded-md"
            ),
            month_grid: "w-full border-collapse relative z-0",
            weekdays: "flex w-full mb-2",
            weekday: "text-muted-foreground w-9 font-bold text-[10px] uppercase tracking-wider flex-1 flex items-center justify-center",
            week: "flex w-full mt-1",
            day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 flex items-center justify-center",
            day_button: cn(
              "h-8 w-8 sm:h-9 sm:w-9 p-0 font-bold hover:bg-primary/10 hover:text-primary transition-all text-xs w-full rounded-lg flex items-center justify-center border border-transparent"
            ),
            selected: "bg-primary! text-primary-foreground! hover:bg-primary! hover:text-primary-foreground! shadow-md shadow-primary/20",
            today: "bg-muted text-primary font-black border-primary/20",
            outside: "day-outside text-muted-foreground/30 opacity-50 pointer-events-none",
            disabled: "text-muted-foreground/20 opacity-50",
            hidden: "invisible",
            ...classNames,
          }}
          components={{
            Chevron: ({ orientation }) => {
              const Icon = orientation === "left" ? ChevronLeft : ChevronRight;
              return <Icon className="h-4 w-4 stroke-[3px]" />;
            },
            MonthCaption: ({ calendarMonth }) => {
              const date = calendarMonth.date;
              const monthName = date.toLocaleString('default', { month: 'long' });
              const year = date.getFullYear();
              
              return (
                <div className="flex items-center justify-center gap-1.5 w-full">
                   <span className="text-sm font-black text-foreground">{monthName}</span>
                   <button 
                    type="button"
                    onClick={handleYearClick}
                    className="text-sm font-black text-primary hover:bg-primary/5 px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1"
                   >
                     {year}
                     <div className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                   </button>
                </div>
              )
            }
          }}
          {...props}
        />
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

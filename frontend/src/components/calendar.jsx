import { useState } from "react";

export default function Calendar({ tasks = [], onDayClick }) {
    const now         = new Date();
    const year        = now.getFullYear();
    const month       = now.getMonth();
    const today       = now.getDate();
    const [selected, setSelected] = useState(null);

    const monthNames = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const deadlineMap = {};      // all tasks — for clicking and display
    const pendingMap = {};        // incomplete only — for the dot

    tasks.filter(t => t.deadline).forEach(t => {
        const d = new Date(t.deadline);
        const day      = d.getDate();
        const taskMonth = d.getMonth();
        const taskYear  = d.getFullYear();
        if (taskYear === year && taskMonth === month) {
            if (!deadlineMap[day]) deadlineMap[day] = [];
            deadlineMap[day].push(t);
            if (!t.completed) {
                if (!pendingMap[day]) pendingMap[day] = [];
                pendingMap[day].push(t);
            }
        }
    });
    tasks.filter(t => t.deadline && !t.completed).forEach(t => {
        const d = new Date(t.deadline);
        const day   = d.getDate();
        const taskMonth = d.getMonth();
        const taskYear  = d.getFullYear();
        if (taskYear === year && taskMonth === month) {
            if (!deadlineMap[day]) deadlineMap[day] = [];
            deadlineMap[day].push(t);
        }
    });
    const blanks = Array(firstDay).fill(null);
    const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const handleClick = (d) => {
        const newSelected = selected === d ? null : d;
        setSelected(newSelected);
        if (!newSelected) {
            if (onDayClick) onDayClick([], null, false);
            return;
        }
        const matched = deadlineMap[d] || [];
        const allDone = matched.length > 0 && matched.every(t=>t.completed);
        const label = `${monthNames[month].slice(0, 3)} ${String(d).padStart(2, "0")}`;
        if (onDayClick) onDayClick(matched, label, allDone);
    };

    return (
        <div className="rounded-2xl p-5 transition-colors duration-200" style={{ backgroundColor: "var(--calendar-color)" }}>
            <div className="text-base font-bold mb-3" style={{ color: "var(--calendar-text)" }}>
                {monthNames[month]} {year}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center pb-2">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <span key={d} className="text-sm font-bold" style={{ color: "var(--calendar-text)" }}>{d}</span>
                ))}
                
                {blanks.map((_, i) => <span key={`b${i}`} />)}
                {days.map(d => (
                    <span
                        key={d}
                        onClick={() => handleClick(d)}
                        className={[
                            "relative text-xl px-1 py-1 rounded-2xl text-center cursor-pointer transition-all duration-150",
                            d === today ? "font-bold rounded-full" : "",
                            pendingMap[d] ? "font-bold" : "",
                            selected === d ? "ring-2 ring-offset-1" : ""
                        ].join(" ")}
                        style={{
                            color: d === today ? "var(--calendar-today)"
                                : pendingMap[d] ? "var(--accent)"
                                : "var(--calendar-text)",
                            backgroundColor: d === today ? "var(--calendar-color)" : undefined,
                        }}
                    >
                        {d}
                        {pendingMap[d] && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full block"
                                  style={{ backgroundColor: "var(--danger)" }} />
                        )}

                    </span>
                ))}
                
            </div>
        </div>
    );
}
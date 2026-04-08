import { useState } from "react";

export default function Calendar({ tasks = [] }) {
    const now         = new Date();
    const year        = now.getFullYear();
    const month       = now.getMonth();
    const today       = now.getDate();
    const [selected, setSelected] = useState(null);

    const monthNames = ["January","February","March","April","May","June",
                        "July","August","September","October","November","December"];

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const deadlineMap = {};
    tasks
        .filter(t => t.deadline)
        .forEach(t => {
            const d = new Date(t.deadline);
            const day = d.getUTCDate();
            const taskMonth = d.getUTCMonth();
            const taskYear = d.getUTCFullYear();
            if (taskYear === year && taskMonth === month) {
                if (!deadlineMap[day]) deadlineMap[day] = [];
                deadlineMap[day].push(t);
            }
        });

    const blanks = Array(firstDay).fill(null);
    const days   = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const selectedTasks = selected ? (deadlineMap[selected] || []) : [];

    return (
        <div className="rounded-2xl p-5 transition-colors duration-200" style={{ backgroundColor: "var(--calendar-color)" }}>
            
            {/* Header */}
            <div className="text-base font-bold mb-3" style={{ color: "var(--calendar-text)" }}>
                {monthNames[month]} {year}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center pb-5">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <span key={d} className="text-sm font-bold" style={{ color: "var(--calendar-text)" }}>
                        {d}
                    </span>
                ))}
                {blanks.map((_, i) => <span key={`b${i}`} />)}
                {days.map(d => (
                    <span
                        key={d}
                        onClick={() => setSelected(prev => prev === d ? null : d)}
                        className={[
                            "relative text-xl px-1 py-1 rounded-2xl text-center cursor-pointer transition-all duration-150",
                            d === today
                                ? "font-bold rounded-full"
                                : "",
                            deadlineMap[d] ? "font-bold" : "",
                            selected === d ? "ring-2 ring-offset-1" : ""
                        ].join(" ")}
                        style={{
                            color: d === today
                                ? "var(--calendar-today)"
                                : deadlineMap[d]
                                    ? "var(--accent)"
                                    : "var(--calendar-text)",
                            backgroundColor: d === today ? "var(--calendar-color)" : undefined,
                            ringColor: "var(--accent)"
                        }}
                    >
                        {d}
                        {deadlineMap[d] && (
                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full block"
                                  style={{ backgroundColor: "var(--danger)" }} />
                        )}
                    </span>
                ))}
            </div>

            {/* Task details panel */}
            {selected && (
                <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}>
                    <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
                        {selectedTasks.length > 0
                            ? `${monthNames[month]} ${selected} — ${selectedTasks.length} task${selectedTasks.length > 1 ? "s" : ""}`
                            : `${monthNames[month]} ${selected} — No tasks`
                        }
                    </div>
                    {selectedTasks.length === 0 && (
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nothing to do</p>
                    )}
                    {selectedTasks.map(task => (
                        <div key={task.id}
                             className={`text-sm p-2 rounded-lg mb-1 ${task.completed ? "opacity-50 line-through" : ""}`}
                             style={{ backgroundColor: "var(--bg)" }}>
                            <div className="font-semibold mb-0.5">
                                {task.completed ? "✅" : "🔲"} {task.title}
                            </div>
                            {task.category && <div className="text-xs opacity-75">🏷️ {task.category}</div>}
                            {task.description && <div className="text-xs opacity-75">📝 {task.description}</div>}
                            <div className="text-xs opacity-75">
                                ⏰ {new Date(task.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
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

    // Map day -> tasks
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
        <div className ="calendar">
            <div className="calendar-header">{monthNames[month]} {year}</div>
            <div className="calendar-grid">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                    <span key={d} className="calendar-day-label">{d}</span>
                ))}
                {blanks.map((_, i) => <span key={`b${i}`} />)}
                {days.map(d => (
                    <span
                        key={d}
                        className={[
                            d === today ? "today" : "",
                            deadlineMap[d] ? "has-deadline" : "",
                            selected === d ? "selected-day" : ""
                        ].join(" ")}
                        onClick={() => setSelected(prev => prev === d ? null : d)}
                    >
                        {d}
                        {deadlineMap[d] && <span className="deadline-dot" />}
                    </span>
                ))}
            </div>

            {/* Task details panel */}
            {selected && (
                <div className="calendar-task-panel">
                    <div className="calendar-task-panel-header">
                        {selectedTasks.length > 0
                            ? `${monthNames[month]} ${selected} — ${selectedTasks.length} task${selectedTasks.length > 1 ? "s" : ""}`
                            : `${monthNames[month]} ${selected} — No tasks`
                        }
                    </div>
                    {selectedTasks.length === 0 && (
                        <p className="calendar-no-tasks">Nothing to do</p>
                    )}
                    {selectedTasks.map(task => (
                        <div key={task.id} className={`calendar-task-item ${task.completed ? "completed" : ""}`}>
                            <div className="calendar-task-title">
                                {task.completed ? "✅" : "🔲"} {task.title}
                            </div>
                            {task.category && (
                                <div className="calendar-task-meta">🏷️ {task.category}</div>
                            )}
                            {task.description && (
                                <div className="calendar-task-meta">📝 {task.description}</div>
                            )}
                            <div className="calendar-task-meta">
                                ⏰ {new Date(task.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, toggleTask, deleteTask, updateTaskCategory, updateTaskDeadline, updateTaskDescription, updateTaskTitle, addTask } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/navbar";
import Calendar from "../components/calendar";

// ============================================================
// CONSTANTS
// ============================================================
const CATEGORIES = [
    { value: "",           label: "Select a category" },
    { value: "work",       label: "💼 Work" },
    { value: "personal",   label: "🏠 Personal" },
    { value: "health",     label: "💪 Health" },
    { value: "finance",    label: "💰 Finance" },
    { value: "education",  label: "📚 Education" },
    { value: "other",      label: "📌 Other" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const modalInput = "w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono outline-none transition-colors duration-500 focus:border-violet-600 resize-none";
const defaultDeadline = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

// ============================================================
// SUB-COMPONENTS
// ============================================================
function Countdown({ deadline }) {
    const [timeLeft, setTimeLeft] = useState("");
    useEffect(() => {
        const calc = () => {
            const diff = new Date(deadline) - new Date();
            if (diff <= 0) { setTimeLeft("Overdue"); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if (d > 0)      setTimeLeft(`${d}d ${h}h ${m}m`);
            else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
            else            setTimeLeft(`${m}m ${s}s`);
        };
        calc();
        const interval = setInterval(calc, 1000);
        return () => clearInterval(interval);
    }, [deadline]);
    return (
        <span className={`text-xs font-mono font-semibold ${timeLeft === "Overdue" ? "text-red-500" : "text-blue-950"}`}>
            ⏱ {timeLeft}
        </span>
    );
}

function CategorySelect({ value, onChange, style }) {
    return (
        <select className={modalInput} style={style} value={value} onChange={onChange}>
            {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
            ))}
        </select>
    );
}

function AddModal({ open, form, setForm, error, loading, onSubmit, onClose, styles }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                 style={styles.cardA}
                 onKeyDown={e => e.key === "Enter" && onSubmit(e)}>
                <h3 className="text-lg font-bold mb-2" style={styles.labelAlt}>Add Task</h3>
                {error && <p className="text-red-500 font-semibold text-sm mb-2">{error}</p>}

                <label className="text-xs font-semibold mt-1.5" 
                    style={styles.labelAlt}>Title</label>
                <input className={modalInput} style={styles.cardA}
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />

                <label className="text-xs font-semibold mt-1.5" 
                    style={styles.labelAlt}>Description (Optional)</label>
                <textarea rows={3} className={modalInput} style={styles.cardA}
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />

                <label className="text-xs font-semibold mt-1.5" 
                    style={styles.labelAlt}>Deadline (Optional)</label>
                <input type="datetime-local" className={modalInput} style={styles.cardA}
                    value={form.deadline}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                <label className="text-xs font-semibold mt-1.5" 
                    style={styles.labelAlt}>Category (Optional)</label>
                <CategorySelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={styles.cardA} />

                <div className="flex gap-2.5 mt-4">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border-1 rounded-full font-semibold text-sm cursor-pointer transition-all duration-500 hover:bg-gray-200"
                        style={styles.cardA}>Cancel</button>
                    <button onClick={onSubmit} disabled={loading}
                        className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-500 disabled:opacity-60"
                        style={styles.accent}
                        onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                        onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>
                        {loading ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function EditModal({ taskId, form, setForm, onSave, onClose, styles }) {
    if (!taskId) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                 style={styles.surface}
                 onKeyDown={e => e.key === "Enter" && onSave()}>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>Edit Task</h3>

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Title</label>
                <input className={modalInput} style={styles.surface}
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Description</label>
                <textarea rows={3} className={modalInput} style={styles.surface}
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Deadline</label>
                <input type="datetime-local" className={modalInput} style={styles.surface}
                    value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Category</label>
                <CategorySelect value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={styles.surface} />

                <div className="flex gap-2.5 mt-4">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-full border-1 font-semibold text-sm cursor-pointer transition-all duration-500 hover:bg-gray-200"
                        style={styles.surface}>Cancel</button>
                    <button onClick={onSave}
                        className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-500"
                        style={styles.accent}
                        onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                        onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>Save</button>
                </div>
            </div>
        </div>
    );
}

function DeleteModal({ taskId, tasks, onConfirm, onClose }) {
    if (!taskId) return null;
    const task = tasks.find(t => t.id === taskId);
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4 z-10"
                 style={{ background: "var(--surface)", color: "var(--text)" }}>
                <h3 className="text-lg font-bold" style={{ color: "var(--danger)" }}>🗑️ Delete Task</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Are you sure you want to delete <strong style={{ color: "var(--text)" }}>{task?.title}</strong>? This cannot be undone.
                </p>
                <div className="flex gap-2.5">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 border-1 rounded-full font-semibold text-sm cursor-pointer transition-all duration-500 hover:bg-gray-200"
                        style={{ background: "var(--surface)", color: "var(--text)" }}>Cancel</button>
                    <button onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-500"
                        style={{ background: "var(--danger)" }}
                        onMouseOver={e => e.currentTarget.style.background = "#dc2626"}
                        onMouseOut={e => e.currentTarget.style.background = "var(--danger)"}>Delete</button>
                </div>
            </div>
        </div>
    );
}
//---category panel----------------------------------------
function CategoryPanel({tasks, selected, onSelect, styles}){
    const counts = {};
    CATEGORIES.slice(1).forEach(c => {
        counts[c.value] = tasks.filter(t=>t.category===c.value).length;            
    });
    const uncategorized = tasks.filter(t=>!t.category).length;
    const items=[
        {value:null, label: "All", icon: "📋", count:tasks.length},
        ...CATEGORIES.slice(1).map(c=>({...c, icon: c.label.split(" ")[0], label:c.label.split(" ").slice(1).join(" "), count: counts[c.value]||0})),
        {value:"uncategorized", label:"Uncategorized", icon:"◯", count:uncategorized}
    ];
    return(
        <div className="flex flex-col gap-1 py-5 w-44 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2 opacity-50"
            style={styles.calendar}>Categories</p>
            {items.map(item => {
                const isActive = selected === item.value;
                return (
                    <button
                        key={String(item.value)}
                        onClick={() => onSelect(isActive ? null : item.value)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium cursor-pointer transition-all duration-500 hover:scale-[1.02]"
                        style={isActive
                            ? { background: "var(--accent)", color: "#fff" }
                            : { background: "transparent", color: "var(--text)", opacity: 0.75 }
                        }>
                        <span style={{ fontSize: "14px" }}>{item.icon}</span>
                        <span className="flex-1 truncate">{item.label}</span>
                        <span className="text-xs font-mono opacity-70 ml-auto"
                            style={{ color: isActive ? "#fff" : "var(--text)" }}>
                            {item.count}
                        </span>
                    </button>
                );
            })}
        </div>

    )
}


// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Index() {
    const [tasks, setTasks]                      = useState([]);
    const [clickedCard, setClickedCard]          = useState(null);
    const [add, setAdd]                          = useState(false);
    const [addForm, setAddForm]                  = useState({ title: "", description: "", deadline: defaultDeadline(), category: "" });
    const [editingTask, setEditingTask]          = useState(null);
    const [editForm, setEditForm]                = useState({ title: "", description: "", deadline: "", category: "" });
    const [confirmDeleteId, setConfirmDeleteId]  = useState(null);
    const [error, setError]                      = useState("");
    const [loading, setLoading]                  = useState(false);
    const [highlightedIds, setHighlightedIds]    = useState([]);
    const [selectedDate, setSelectedDate]        = useState(null);
    const [isFiltered, setIsFiltered]            = useState(false);
    const [selectedCategory, setSelectedCategory]= useState(null);
    const [allDone, setAllDone]                  = useState(false);
    const [time, setTime]                        = useState(new Date().toLocaleTimeString());
    const { isDark }                             = useContext(DarkModeContext);
    const navigate                               = useNavigate();

    // ── Styles ──────────────────────────────────────────────
    const styles = {
        bg:       { background: "var(--bg)",       color: "var(--text)" },
        surface:  { background: "var(--surface)",  color: "var(--text)" },
        cardA:    { background: "var(--card-a)",   color: "var(--card-a-text)" },
        accent:   { background: "var(--accent)" },
        calendar: { background: "var(--calendar-color)", color: "var(--card-a-text)" },
        label:    { color: "var(--card-b)" },
        labelAlt: { color: "var(--card-a-text)" },
    };

    const cardStyle = {
        yellow: { background: "var(--card-a)",    color: "var(--card-a-text)" },
        purple: { background: "var(--card-b)",    color: "var(--card-b-text)" },
        blue:   { background: "var(--card-blue)", color: "var(--card-blue-text)" },
    };

    const cardColors = isDark ? ["blue", "purple"] : ["yellow", "purple"];

    // ── Auth ─────────────────────────────────────────────────
    const getUsername = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try { return JSON.parse(atob(token.split(".")[1])).sub; }
        catch { return null; }
    };

    const isTokenExpired = () => {
        const token = localStorage.getItem("access_token");
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp * 1000 < Date.now();
        } catch { return true; }
    };

    // ── Effects ──────────────────────────────────────────────
    const refresh = async () => {
        const data = await getTasks();
        if (data) setTasks(data);
    };

    useEffect(() => {
        if (!localStorage.getItem("access_token") || isTokenExpired()) {
            localStorage.removeItem("access_token");
            navigate("/login");
            return;
        }
        refresh();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isTokenExpired()) { localStorage.removeItem("access_token"); navigate("/login"); }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isFiltered || !selectedDate) return;
        const [mon, day] = selectedDate.split(" ");
        const monthIndex = MONTH_NAMES.indexOf(mon);
        const dayNum     = parseInt(day);
        const now        = new Date();
        const matched    = tasks.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.getDate() === dayNum && d.getMonth() === monthIndex && d.getFullYear() === now.getFullYear();
        });
        setHighlightedIds(matched.map(t => t.id));
        setAllDone(matched.length > 0 && matched.every(t => t.completed));
    }, [tasks]);

    // ── Handlers ─────────────────────────────────────────────
    const handleToggle  = async (id) => { await toggleTask(id); refresh(); };
    const handleDelete  = (id) => setConfirmDeleteId(id);
    const handleCardClick = (id) => setClickedCard(prev => prev === id ? null : id);

    const confirmDelete = async () => {
        await deleteTask(confirmDeleteId);
        setConfirmDeleteId(null);
        refresh();
    };

    const openEdit = (task) => {
        setEditingTask(task.id);
        setEditForm({
            title:       task.title || "",
            description: task.description || "",
            deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : defaultDeadline(),
            category:    task.category || ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim()) { setError("Title is required"); return; }
        setLoading(true);
        try {
            await addTask(addForm.title, addForm.description, addForm.deadline, addForm.category);
            setAdd(false);
            setAddForm({ title: "", description: "", deadline: "", category: "" });
            setError("");
            refresh();
        } catch (err) {
            setError(err.message.includes("409") ? "Task already exists" : "Failed to add task");
        } finally {
            setLoading(false);
        }
    };

    const saveEdit = async () => {
        const task = tasks.find(t => t.id === editingTask);
        if (editForm.title !== task.title)                                          await updateTaskTitle(editingTask, editForm.title);
        if (editForm.description && editForm.description !== task.description)      await updateTaskDescription(editingTask, editForm.description);
        if (editForm.deadline && editForm.deadline !== task.deadline)               await updateTaskDeadline(editingTask, editForm.deadline);
        if (editForm.category && editForm.category !== task.category)               await updateTaskCategory(editingTask, editForm.category);
        setEditingTask(null);
        refresh();
    };

    const filterToday = () => {
        const now        = new Date();
        const todayLabel = `${MONTH_NAMES[now.getMonth()]} ${String(now.getDate()).padStart(2, "0")}`;
        const matched    = tasks.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        setHighlightedIds(matched.map(t => t.id));
        setSelectedDate(todayLabel);
        setIsFiltered(true);
        setAllDone(matched.length > 0 && matched.every(t => t.completed));
    };

    const clearFilter = () => { setHighlightedIds([]); setSelectedDate(null); setIsFiltered(false); };

    // ── Derived ──────────────────────────────────────────────
    const username     = getUsername();

    const today = DAY_NAMES[new Date().getDay()];

    const visibleTasks = (() => {
        let list = isFiltered ? tasks.filter(t => highlightedIds.includes(t.id)) : tasks;

        if (selectedCategory !== null) {
            if (selectedCategory === "uncategorized") {
                list = list.filter(t => !t.category);
            } else {
                list = list.filter(t => t.category === selectedCategory);
            }
        }

        return list.sort((a, b) => {
            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    })();
    // ── Render ───────────────────────────────────────────────
    return (
        <>
            <Navbar showLogout username={username} />


            <div className="flex flex-col items-center w-full"
                 style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", padding: "1em 2em" }}>

                {/* Main layout */}
                <div className="flex justify-between px-7 gap-20 w-full overflow-x-auto">
                    {/* category panel */}
                    <div className="flex flex-col gap-4 w-44 shrink-0">
                        <CategoryPanel
                            tasks={tasks}
                            selected={selectedCategory}
                            onSelect={setSelectedCategory}
                            styles={styles.calendar}
                        />
                    {/* Task count */}
                    <div className="mt-4 rounded-[14px] px-4 py-3.5 shadow-sm" style={styles.calendar}>
                        <div className="text-center">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Tasks</span>
                            <div className="text-4xl font-bold font-mono mt-1">{visibleTasks.length}</div>
                        </div>
                        <div className="flex justify-center gap-8 mt-3">
                            <div className="text-center">
                                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Completed</span>
                                <div className="text-3xl font-bold font-mono mt-1 text-green-500">
                                    {visibleTasks.filter(t => t.completed).length}
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Remaining</span>
                                <div className="text-3xl font-bold font-mono mt-1 text-red-500">
                                    {visibleTasks.filter(t => !t.completed).length}
                                </div>
                            </div>
                        </div>
                    </div>

                    </div>

                    {/* Left — tasks */}
                    <div className="flex flex-col flex-1 gap-3">

                        
                        {/* Toolbar */}
                        <div className="flex gap-1 py-0.5">
                            <button onClick={filterToday}
                                className="self-start text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-500 hover:scale-105"
                                style={{ background: "var(--accent)", color: "var(--card-b-text)"}}>
                                📅 Today
                            </button>
                            {/* Filter bar */}
                            {selectedDate && (
                                <div className="flex items-center text-xs gap-1 font-semibold px-1" style={{ color: "var(--card-a-text)" }}>
                                    {selectedDate}
                                    <button onClick={clearFilter} className="cursor-pointer ml-2" style={{ color: "var(--danger)" }}>✕</button>
                                </div>
                            )}
                            {selectedCategory && (
                                <div className="flex items-center text-xs gap-1 font-semibold px-1" style={{ color: "var(--card-b)" }}>
                                    {selectedCategory}
                                    <button onClick={()=> setSelectedCategory(null)} className="cursor-pointer ml-2" style={{ color: "var(--danger)" }}>✕</button>
                                </div>
                            )}

                            <button onClick={() => setAdd(true)}
                                className="w-8 h-8 rounded-full text-white text-md border-none cursor-pointer shadow-md transition-all duration-500 hover:scale-110 hover:rotate-90 ml-auto"
                                style={styles.accent}
                                onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                                onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>+</button>
                        </div>


                        {/* Empty state cards */}
                        {selectedDate && highlightedIds.length === 0 && !allDone && (
                            <div className="w-full px-5 py-7 text-4xl font-mono rounded-[14px] text-center" style={styles.cardA}>
                                Nothing to do
                            </div>
                        )}
                        {selectedDate && allDone && (
                            <div className="w-full px-5 py-7 text-4xl font-mono rounded-[14px] text-center" style={styles.cardA}>
                                All done for the day! 🎉
                            </div>
                        )}



                        {/* Task cards */}
                        {visibleTasks.map((task, i) => (
                            <div key={task.id}
                                className={`task-wrapper text-xl w-full px-4 py-3.5 rounded-[14px] relative cursor-pointer shadow-sm transition-all duration-500 hover:shadow-lg ${clickedCard === task.id ? "clicked" : ""}`}
                                style={cardStyle[cardColors[i % 2]]}
                                onClick={() => handleCardClick(task.id)}>

                                <div className={`font-semibold pr-24 leading-snug ${task.completed ? "line-through opacity-50" : ""}`}>
                                    {task.title}
                                </div>

                                {task.deadline && !task.completed && (
                                    <div className="mt-1"><Countdown deadline={task.deadline} /></div>
                                )}

                                <div className="absolute top-3 right-3 flex gap-1">
                                    {[
                                        { fn: () => handleToggle(task.id), icon: task.completed ? "☑️" : "✔️" },
                                        { fn: () => openEdit(task),         icon: "✒️" },
                                        { fn: () => handleDelete(task.id),  icon: "🚮" },
                                    ].map(({ fn, icon }, idx) => (
                                        <button key={idx}
                                            onClick={e => { e.stopPropagation(); fn(); }}
                                            className="bg-white/25 border-none px-1.5 py-1 rounded-lg cursor-pointer text-sm transition-all duration-500 hover:bg-white/45 hover:scale-110">
                                            {icon}
                                        </button>
                                    ))}
                                </div>

                                <div className={`task-preview ${clickedCard === task.id ? "clicked" : ""}`}>
                                    <p>📝 {task.description || "No description"}</p>
                                    <p>⏰ {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}</p>
                                    <p>🏷️ {task.category || "No category"}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right panel */}
                    <div className="flex flex-col gap-5 w-70 py-13 shrink-0">

                        {/* Clock */}
                        <div className="rounded-2xl" style={{ ...styles.calendar, padding: "2em" }}>
                            <div className="text-sm" style={{ color: "var(--calendar-text)" }}>
                                {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()} {today}
                            </div>
                            <div className="text-6xl font-medium leading-none pt-2 tracking-tight"
                                 style={{ color: "var(--card-a-text)" }}>
                                {time}
                            </div>
                        </div>

                        {/* Calendar */}
                        <Calendar tasks={tasks}
                            onDayClick={(matched, day, done) => {
                                setHighlightedIds(matched.map(t => t.id));
                                setSelectedDate(day);
                                setIsFiltered(day !== null);
                                setAllDone(done);
                            }}
                        />

                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddModal
                open={add} form={addForm} setForm={setAddForm}
                error={error} loading={loading}
                onSubmit={handleSubmit} onClose={() => { setAdd(false); setAddForm({ title: "", description: "", deadline: defaultDeadline(), category: "" }); setError(""); }}
                styles={styles}
            />
            <EditModal
                taskId={editingTask} form={editForm} setForm={setEditForm}
                onSave={saveEdit} onClose={() => setEditingTask(null)}
                styles={styles}
            />
            <DeleteModal
                taskId={confirmDeleteId} tasks={tasks}
                onConfirm={confirmDelete} onClose={() => setConfirmDeleteId(null)}
            />
        </>
    );
}
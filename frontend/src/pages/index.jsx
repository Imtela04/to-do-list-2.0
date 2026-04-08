import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, toggleTask, deleteTask, updateTaskCategory, updateTaskDeadline, updateTaskDescription, updateTaskTitle, addTask } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/navbar";
import Calendar from "../components/calendar";

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
            if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
            else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
            else setTimeLeft(`${m}m ${s}s`);
        };
        calc();
        const interval = setInterval(calc, 1000);
        return () => clearInterval(interval);
    }, [deadline]);

    return (
        <span className={`text-xs font-mono font-semibold ${timeLeft === "Overdue" ? "text-red-500" : "text-green-400"}`}>
            ⏱ {timeLeft}
        </span>
    );
}
export default function Index() {
    const [tasks, setTasks]             = useState([]);
    const [clickedCard, setClickedCard] = useState(null);
    const [add, setadd]                 = useState(null);
    const [editForm, setEditForm]       = useState({ title: "", description: "", deadline: "", category: "" });
    const [editingTask, setEditingTask] = useState(null);
    const [addForm, setAddForm]         = useState({ title: "", description: "", deadline: "", category: "" });
    const [error, setError]             = useState("");
    const [loading, setLoading]         = useState(false);
    const [highlightedIds, setHighlightedIds] = useState([]);
    const [selectedDate, setSelectedDate]     = useState(null);
    const { isDark }                    = useContext(DarkModeContext);
    const [isFiltered, setIsFiltered] = useState(false);
    const [allDone, setAllDone] = useState(false);
    const navigate                      = useNavigate();

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
            if (isTokenExpired()) {
                localStorage.removeItem("access_token");
                navigate("/login");
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h >= 5  && h < 12) return { emoji: "🌅", text: "Good Morning",   sub: "Fresh start. Let's get it!" };
        if (h >= 12 && h < 17) return { emoji: "🌤️", text: "Good Afternoon", sub: "Keep up the momentum!" };
        if (h >= 17 && h < 24) return { emoji: "🌇", text: "Good Evening",   sub: "You're almost there!" };
        return                         { emoji: "🌙", text: "Good Night",     sub: "Recharge for tomorrow." };
    };

    const [time, setTime] = useState(new Date().toLocaleTimeString());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = async (id) => { await toggleTask(id); refresh(); };
    const handleDelete = async (id) => { await deleteTask(id); refresh(); };
    const handleCardClick = (id) => { setClickedCard(prev => prev === id ? null : id); };

    const openEdit = (task) => {
        setEditingTask(task.id);
        setEditForm({
            title:       task.title || "",
            description: task.description || "",
            deadline:    task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
            category:    task.category || ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim()) { setError("Title is required"); return; }
        setLoading(true);
        try {
            await addTask(addForm.title, addForm.description, addForm.deadline, addForm.category);
            setadd(null);
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
        if (editForm.title !== task.title) await updateTaskTitle(editingTask, editForm.title);
        if (editForm.description && editForm.description !== task.description) await updateTaskDescription(editingTask, editForm.description);
        if (editForm.deadline && editForm.deadline !== task.deadline) await updateTaskDeadline(editingTask, editForm.deadline);
        if (editForm.category && editForm.category !== task.category) await updateTaskCategory(editingTask, editForm.category);
        setEditingTask(null);
        refresh();
    };

    const clearFilter = () => { setHighlightedIds([]); setSelectedDate(null); setIsFiltered(false); };
    const greeting   = getGreeting();
    const username   = getUsername();
    const cardColors = isDark ? ["blue", "purple"] : ["yellow", "purple"];
    const modalInput = "w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono outline-none transition-colors duration-200 focus:border-violet-600 resize-none";
    const cardStyle  = {
        yellow: { background: "var(--card-a)",    color: "var(--card-a-text)" },
        purple: { background: "var(--card-b)",    color: "var(--card-b-text)" },
        blue:   { background: "var(--card-blue)", color: "var(--card-blue-text)" },
    };

    const visibleTasks = (isFiltered
        ? tasks.filter(t => highlightedIds.includes(t.id))
        : tasks).sort((a,b)=>{
            if (a.completed !==b.completed) return Number(a.completed)-Number(b.completed);
            if (!a.deadline && !b.deadline) return 0;   
            if(!a.deadline) return 1;
            if(!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);

        });

    
    useEffect(() => {
        if (!isFiltered || !selectedDate) return;
        const [mon, day] = selectedDate.split(" ");
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthIndex = monthNames.indexOf(mon);
        const dayNum = parseInt(day);
        const now = new Date();

        const matched = tasks.filter(t => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            return d.getDate() === dayNum &&
                d.getMonth() === monthIndex &&
                d.getFullYear() === now.getFullYear();
        });

        const allDoneNow = matched.length > 0 && matched.every(t => t.completed);
        setHighlightedIds(matched.map(t => t.id));
        setAllDone(allDoneNow);
    }, [tasks]);

    return (
        <div className="flex flex-col items-center w-full" style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", padding: "1em 5em" }}>
            <Navbar showLogout username={username} />

            {/* Hero */}
            <header className="flex flex-col items-center text-center py-16 px-10 gap-2 w-full">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                    {greeting.emoji} {greeting.text}, {username}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{greeting.sub}</p>
            </header>

            {/* Main layout */}
            <div className="flex justify-between gap-16 w-full md:flex-row flex-col">

                {/* Left panel */}
                <div className="flex flex-col gap-5 min-w-[30%]">
                    <div className="p-5 rounded-2xl" style={{ backgroundColor: "var(--clock-color)" }}>
                        <div className="text-sm" style={{ color: "var(--clock-text)" }}>
                            {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}
                        </div>
                        <div className="text-7xl font-medium leading-none pt-2 tracking-tight" style={{ color: "var(--clock-text)" }}>
                            {time}
                        </div>
                    </div>
                    <Calendar
                        tasks={tasks}
                        onDayClick={(matched, day, done) => {
                            setHighlightedIds(matched.map(t => t.id));
                            setSelectedDate(day);
                            setIsFiltered(day !== null);
                            setAllDone(done);
                        }}
                    />
                    {/* Task count */}
                    <div className="mt-4 rounded-[14px] px-4 py-3.5 shadow-sm" style={{ background: "var(--card-a)", color: "var(--card-a-text)" }}>
                        <div className="text-center">
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Tasks</span>
                            <div className="text-4xl font-bold font-mono mt-1">{visibleTasks.length}</div>
                        </div>
                        <div className="flex justify-center gap-8 mt-3">
                            <div className="text-center">
                                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Completed</span>
                                <div className="text-3xl font-bold font-mono mt-1 text-green-500">{visibleTasks.filter(t => t.completed).length}</div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Remaining</span>
                                <div className="text-3xl font-bold font-mono mt-1 text-red-500">{visibleTasks.filter(t => !t.completed).length}</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Tasks */}
                <div className="flex flex-col gap-5 w-[40%] py-8">
                    {/* Show Today button */}
                    <button
                        onClick={() => {
                            const now = new Date();
                            const todayLabel = `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][now.getMonth()]} ${String(now.getDate()).padStart(2,"0")}`;
                            const matched = tasks.filter(t => {
                                if (!t.deadline) return false;
                                const d = new Date(t.deadline);
                                return d.getDate() === now.getDate() &&
                                    d.getMonth() === now.getMonth() &&
                                    d.getFullYear() === now.getFullYear();
                            });
                            setHighlightedIds(matched.map(t => t.id));
                            setSelectedDate(todayLabel);
                            setIsFiltered(true);
                            setAllDone(matched.length > 0 && matched.every(t => t.completed));
                        }}
                        className="self-start text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{ background: "var(--accent)", color: "#fff" }}
                    >
                        📅 Today
                    </button>



                    {/* Filter bar */}
                    {selectedDate && (
                        <div className="flex items-center justify-between text-xs font-semibold px-1"
                            style={{ color: "var(--text-muted)" }}>
                            <span>
                                {highlightedIds.length === 0
                                    ? `${selectedDate}`
                                    : `Showing tasks for ${selectedDate}`}
                            </span>
                            <button onClick={clearFilter}
                                    className="underline cursor-pointer"
                                    style={{ color: "var(--accent)" }}>
                                Clear filter
                            </button>
                            {/* )} */}
                        </div>
                    )}
  
                    {/* Nothing to do card */}
                    {selectedDate && highlightedIds.length === 0 && !allDone && (
                        <div className="w-full px-5 py-7 text-4xl font-mono rounded-[14px] text-center"
                            style={{ background: "var(--card-a)", color: "var(--card-a-text)" }}>
                            Nothing to do
                        </div>
                    )}

                    {/* All done card */}
                    {selectedDate && allDone && (
                        <div className="w-full px-5 py-7 text-4xl font-mono rounded-[14px] text-center"
                            style={{ background: "var(--card-a)", color: "var(--card-a-text)" }}>
                            All done for the day! 🎉
                        </div>
                    )}                 
                    
                    {/* Task cards */}
                    {visibleTasks.map((task, i) => (
                        <div
                            key={task.id}
                            className={`task-wrapper w-full px-4 py-3.5 rounded-[14px] relative cursor-pointer shadow-sm transition-all duration-200 hover:shadow-lg ${clickedCard === task.id ? "clicked" : ""}`}
                            style={cardStyle[cardColors[i % 2]]}
                            onClick={() => handleCardClick(task.id)}
                        >
                            <div className={`font-semibold pr-24 leading-snug ${task.completed ? "line-through opacity-50" : ""}`}>
                                {task.title}
                            </div>

                            {/* countdown */}
                            {task.deadline && !task.completed && (
                                <div className="mt-1">
                                    <Countdown deadline={task.deadline} />
                                </div>
                            )}


                            <div className="absolute top-3 right-3 flex gap-1">
                                {[
                                    { fn: () => handleToggle(task.id), icon: task.completed ? "↩️" : "✅" },
                                    { fn: () => openEdit(task),         icon: "✏️" },
                                    { fn: () => handleDelete(task.id),  icon: "🗑️" },
                                ].map(({ fn, icon }, idx) => (
                                    <button key={idx}
                                        onClick={e => { e.stopPropagation(); fn(); }}
                                        className="bg-white/25 border-none px-1.5 py-1 rounded-lg cursor-pointer text-sm transition-all duration-150 hover:bg-white/45 hover:scale-110"
                                    >{icon}</button>
                                ))}
                            </div>
                            <div className={`task-preview ${clickedCard === task.id ? "clicked" : ""}`}>
                                <p>📝 {task.description || "No description"}</p>
                                <p>⏰ {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}</p>
                                <p>🏷️ {task.category || "No category"}</p>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add button */}
                    <button
                        onClick={e => { e.stopPropagation(); setadd(true); }}
                        className="w-12 h-12 rounded-full text-white text-2xl border-none cursor-pointer shadow-md transition-all duration-200 hover:scale-110 hover:rotate-90 ml-auto"
                        style={{ background: "var(--accent)" }}
                        onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                        onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}
                    >+</button>
                </div>
            </div>

            {/* Add modal */}
            {add && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setadd(null)} />
                    <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                         style={{ background: "var(--surface)", color: "var(--text)" }}
                         onKeyDown={e => e.key === "Enter" && handleSubmit(e)}>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>Add Task</h3>
                        {error && <p className="text-red-500 font-semibold text-sm mb-2">{error}</p>}
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Title</label>
                        <input className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Description (Optional)</label>
                        <textarea rows={3} className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={addForm.description} onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Deadline (Optional)</label>
                        <input type="datetime-local" className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={addForm.deadline} onChange={e => setAddForm(p => ({ ...p, deadline: e.target.value }))} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Category (Optional)</label>
                        <input className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))} />
                        <div className="flex gap-2.5 mt-4">
                            <button onClick={() => { setadd(null); setError(""); }}
                                className="flex-1 py-2.5 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-gray-200"
                                style={{ background: "var(--bg)", color: "var(--text)" }}>Cancel</button>
                            <button onClick={handleSubmit} disabled={loading}
                                className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-200 disabled:opacity-60"
                                style={{ background: "var(--accent)" }}
                                onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                                onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>
                                {loading ? "Adding..." : "Add Task"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editingTask && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
                    <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                         style={{ background: "var(--surface)", color: "var(--text)" }}
                         onKeyDown={e => e.key === "Enter" && saveEdit()}>
                        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>Edit Task</h3>
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Title</label>
                        <input className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
                        <textarea rows={3} className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                            onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Deadline</label>
                        <input type="datetime-local" className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={editForm.deadline} onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} />
                        <label className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>Category</label>
                        <input className={modalInput} style={{ background: "var(--bg)", color: "var(--text)" }}
                            value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                        <div className="flex gap-2.5 mt-4">
                            <button onClick={() => setEditingTask(null)}
                                className="flex-1 py-2.5 rounded-full font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-gray-200"
                                style={{ background: "var(--bg)", color: "var(--text)" }}>Cancel</button>
                            <button onClick={saveEdit}
                                className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-200"
                                style={{ background: "var(--accent)" }}
                                onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                                onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks, toggleTask, deleteTask, updateTaskCategory, updateTaskDeadline, updateTaskDescription, updateTaskTitle, addTask } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/navbar";
import RightPanel from "../components/panels/right-panel";
import CategoryPanel from "../components/panels/category-panel";
import { AddModal, EditModal, DeleteModal } from "../components/modals";
import { Countdown } from "../components/countdown"
import { MONTH_NAMES, DAY_NAMES } from "../constants";
import { defaultDeadline } from "../constants";
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

// ── Styles ──────────────────────────────────────────────
const styles = {
    bg:       { background: "var(--bg)",              color: "var(--text)" },
    surface:  { background: "var(--surface)",         color: "var(--text)" },
    cardA:    { background: "var(--card-a)",          color: "var(--card-a-text)" },
    accent:   { background: "var(--accent)" },
    calendar: { background: "var(--calendar-color)",  color: "var(--card-a-text)" },
    label:    { color: "var(--card-b)" },
    labelAlt: { color: "var(--card-a-text)" },
};

const cardStyle = {
    yellow: { background: "var(--card-a)",    color: "var(--card-a-text)" },
    purple: { background: "var(--card-b)",    color: "var(--card-b-text)" },
    blue:   { background: "var(--card-blue)", color: "var(--card-blue-text)" },
};


// ============================================================
// MAIN COMPONENT
// ============================================================
export default function Index() {
    const [tasks, setTasks]                       = useState([]);
    const [clickedCard, setClickedCard]           = useState(null);
    const [add, setAdd]                           = useState(false);
    const [addForm, setAddForm]                   = useState({ title: "", description: "", deadline: defaultDeadline(), category: "" });
    const [editingTask, setEditingTask]           = useState(null);
    const [editForm, setEditForm]                 = useState({ title: "", description: "", deadline: "", category: "" });
    const [confirmDeleteId, setConfirmDeleteId]   = useState(null);
    const [error, setError]                       = useState("");
    const [loading, setLoading]                   = useState(false);
    const [highlightedIds, setHighlightedIds]     = useState([]);
    const [selectedDate, setSelectedDate]         = useState(null);
    const [isFiltered, setIsFiltered]             = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [allDone, setAllDone]                   = useState(false);
    const [time, setTime]                         = useState(new Date().toLocaleTimeString());
    const { isDark }                              = useContext(DarkModeContext);
    const [currentPage, setCurrentPage]     = useState(1);
    const [tasksPerPage, setTasksPerPage]   = useState(10);
    const navigate                                = useNavigate();


    const cardColors = isDark ? ["blue", "purple"] : ["yellow", "purple"];


    // ── Effects ──────────────────────────────────────────────
    const refresh = async () => {
        const data = await getTasks();
        if (data){
            // //console.log("tasks from api: ", data.map(t=>({title:t.title, deadline:t.deadline})));
            setTasks(data);
        } 
        
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
    const handleToggle    = async (id) => { await toggleTask(id); refresh(); };
    const handleDelete    = (id) => setConfirmDeleteId(id);
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
            deadline:    task.deadline ? task.deadline.slice(0,16) : "",
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
            setAddForm({ title: "", description: "", deadline: defaultDeadline(), category: "" });
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
        //console.log("editForm.deadline:", editForm.deadline);
        //console.log("task.deadline:", task.deadline);
        //console.log("task.deadline sliced:", task.deadline ? task.deadline.slice(0, 16) : "");

        if (editForm.title !== task.title) 
            await updateTaskTitle(editingTask, editForm.title);
        if (editForm.description && editForm.description !== task.description) 
            await updateTaskDescription(editingTask, editForm.description);
        if (editForm.deadline) {
            // ✅ compare against sliced version of task deadline for consistency
            const taskDeadline = task.deadline ? task.deadline.slice(0,16) : "";
            if (editForm.deadline !== taskDeadline)
                await updateTaskDeadline(editingTask, editForm.deadline);
        }
        if (editForm.category && editForm.category !== task.category) 
            await updateTaskCategory(editingTask, editForm.category);
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

    const clearFilter         = () => { setHighlightedIds([]); setSelectedDate(null); setIsFiltered(false); };
    const clearCategoryFilter = () => setSelectedCategory(null);

    // ── Derived ──────────────────────────────────────────────
    const username = getUsername();
    const today    = DAY_NAMES[new Date().getDay()];

    const visibleTasks = (() => {
        let list = isFiltered ? tasks.filter(t => highlightedIds.includes(t.id)) : tasks;

        if (selectedCategory !== null) {
            list = selectedCategory === "uncategorized"
                ? list.filter(t => !t.category)
                : list.filter(t => t.category === selectedCategory);
        }

        return list.sort((a, b) => {
            if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });
    })();

    // Reset to page 1 whenever the filtered list changes
    useEffect(() => { setCurrentPage(1); }, [isFiltered, selectedCategory, selectedDate]);

    const totalPages  = Math.ceil(visibleTasks.length / tasksPerPage);
    const pagedTasks  = visibleTasks.slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage);

    // ── Render ───────────────────────────────────────────────
    return (
        <>

            {/* main layout */}
            <div className="flex flex-col items-center w-full"
                style={{ background: "var(--bg)", color: "var(--text)", padding: "1em 2em", minHeight: "100vh" }}>
                <Navbar showLogout username={username} />
                <div className="flex justify-between px-7 gap-20 w-full overflow-x-auto">

                    {/* Left sidebar — category panel + task stats */}
                    <div className="flex flex-col gap-4 w-44 shrink-0">
                        <CategoryPanel
                            tasks={tasks}
                            selected={selectedCategory}
                            onSelect={setSelectedCategory}
                            styles={styles.calendar}
                        />
                        {/* task stats */}
                        <div className="rounded-[14px] px-4 py-3.5 shadow-sm w-44 shrink-0" style={styles.calendar}>
                            <div className="text-center">
                                <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Tasks</span>
                                <div className="text-4xl font-bold font-mono mt-1">{visibleTasks.length}</div>
                            </div>
                            <div className="flex justify-center gap-8 mt-3">
                                <div className="text-center">
                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Completed</span>
                                    <div className="text-3xl font-bold font-mono mt-1" style={{ color: "#22c55e" }}>
                                        {visibleTasks.filter(t => t.completed).length}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Remaining</span>
                                    <div className="text-3xl font-bold font-mono mt-1" style={{ color: "#ef4444" }}>
                                        {visibleTasks.filter(t => !t.completed).length}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Centre — task list */}
                    <div className="flex flex-col flex-1 gap-3 py-3">

                        {/* Toolbar - category+day filters */}                    
                        <div className="flex items-center gap-1 py-0.5">
                            <button onClick={filterToday}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer transition-all duration-500 hover:scale-105"
                                style={{ background: "var(--accent)", color: "var(--card-b-text)" }}>
                                📅 Today
                            </button>

                            {selectedDate && (
                                <div className="flex items-center text-xs gap-1 font-semibold px-1"
                                        style={{ color: "var(--card-a-text)" }}>
                                    {selectedDate}
                                    <button onClick={clearFilter} className="cursor-pointer ml-1"
                                            style={{ color: "var(--danger)" }}>✕</button>
                                </div>
                            )}

                            {selectedCategory && (
                                <div className="flex items-center text-xs gap-1 font-semibold px-1"
                                        style={{ color: "var(--card-a-text)" }}>
                                    {selectedCategory}
                                    <button onClick={clearCategoryFilter} className="cursor-pointer ml-1"
                                            style={{ color: "var(--danger)" }}>✕</button>
                                </div>
                            )}

                            <button onClick={() => setAdd(true)}
                                className="w-8 h-8 rounded-full text-white text-md border-none cursor-pointer shadow-md transition-all duration-500 hover:scale-110 hover:rotate-90 ml-auto"
                                style={styles.accent}
                                onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                                onMouseOut={e => e.currentTarget.style.background = "var(--accent)"}>+</button>
                            
                        </div>

                        {/* Per-page selector */}
                        <div className="flex items-center gap-2 text-xs font-semibold"
                            style={{ color: "var(--card-a-text)", opacity: 0.7 }}>
                            <span>Show</span>
                            {[5, 10, 20, 50].map(n => (
                                <button
                                    key={n}
                                    onClick={() => { setTasksPerPage(n); setCurrentPage(1); }}
                                    className="px-2 py-1 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105"
                                    style={tasksPerPage === n
                                        ? { background: "var(--accent)", color: "#fff" }
                                        : { background: "transparent", color: "var(--card-a-text)", opacity: 0.6 }
                                    }>
                                    {n}
                                </button>
                            ))}
                        </div>

                        {/* Empty state */}
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
                        {pagedTasks.map((task, i) => (
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
                                            className="border-none px-1.5 py-1 rounded-lg cursor-pointer text-sm transition-all duration-500 hover:scale-110" style={{ background: "var(--calendar-color)" }}>
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

                        {/* Pagination */}
                        {visibleTasks.length > 0 && (
                            <div className="flex items-center gap-2 text-xs font-semibold mt-2 px-1"
                                style={{ color: "var(--card-a-text)" }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:cursor-default"
                                    style={{ background: "var(--accent)", color: "#fff" }}>←</button>

                                <span style={{color: "var(--calendar-color)" , opacity: 1 }}>
                                    {currentPage} of {totalPages || 1}
                                </span>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:cursor-default"
                                    style={{ background: "var(--accent)", color: "#fff" }}>→</button>
                            </div>
                        )}

                    </div>

                    {/* Right panel */}
                    <RightPanel
                        tasks={tasks}
                        time={time}
                        today={today}
                        styles={styles}
                        onDayClick={(matched, day, done) => {
                            setHighlightedIds(matched.map(t => t.id));
                            setSelectedDate(day);
                            setIsFiltered(day !== null);
                            setAllDone(done);
                        }}
                    />
    
                </div>
            </div>



            {/* Modals */}
            <AddModal
                open={add} form={addForm} setForm={setAddForm}
                error={error} loading={loading}
                onSubmit={handleSubmit}
                onClose={() => { setAdd(false); setAddForm({ title: "", description: "", deadline: defaultDeadline(), category: "" }); setError(""); }}
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
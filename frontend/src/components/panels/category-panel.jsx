import { useState } from "react";
import { addCategory, deleteCategory, updateCategory } from "../../api";

export const DEFAULT_CATEGORIES = []; // no longer needed but keep export for compatibility

const EMOJI_OPTIONS = ["💼","🏠","💪","💰","📚","📌","🏷️","⭐","🎯","🔥","🎨","🎵","🏋️","✈️","🍕"];

export function CategoryPanel({ tasks, selected, onSelect, customCats = [], onCatsChange }) {
    const [newCat, setNewCat]       = useState("");
    const [newIcon, setNewIcon]     = useState("🏷️");
    const [adding, setAdding]       = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName]   = useState("");
    const [editIcon, setEditIcon]   = useState("");

    const handleAdd = async () => {
        if (!newCat.trim()) return;
        await addCategory(newCat.trim(), newIcon);
        setNewCat(""); setNewIcon("🏷️"); setAdding(false);
        onCatsChange();
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        await deleteCategory(id);
        onCatsChange();
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        await updateCategory(id, editName.trim(), editIcon);
        setEditingId(null);
        onCatsChange();
    };

    const counts = {};
    customCats.forEach(c => { counts[c.name] = tasks.filter(t => t.category === c.name).length; });
    const uncategorized = tasks.filter(t => !t.category || !customCats.find(c => c.name === t.category)).length;

    const items = [
        { id: null,           value: null,            icon: "📋", label: "All",           count: tasks.length },
        ...customCats.map(c => ({ id: c.id, value: c.name, icon: c.icon || "🏷️", label: c.name, count: counts[c.name] || 0 })),
        { id: "uncat",        value: "uncategorized", icon: "◯",  label: "Uncategorized", count: uncategorized },
    ];

    return (
        <div className="flex flex-col gap-1 py-5 w-44 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2">Categories</p>

            {items.map(item => {
                const isActive = selected === item.value;

                if (item.id && item.id !== "uncat" && editingId === item.id) {
                    return (
                        <div key={item.id} className="flex flex-col gap-1 px-2 py-1">
                            <div className="flex items-center gap-1">
                                <input autoFocus value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleRename(item.id); if (e.key === "Escape") setEditingId(null); }}
                                    className="flex-1 px-2 py-1 rounded-lg text-xs outline-none border"
                                    style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--accent)" }}
                                />
                                <button onClick={() => handleRename(item.id)} className="text-xs font-bold cursor-pointer" style={{ color: "var(--accent)" }}>✓</button>
                                <button onClick={() => setEditingId(null)} className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}>✕</button>
                            </div>
                            <div className="flex flex-wrap gap-1 px-1">
                                {EMOJI_OPTIONS.map(e => (
                                    <button key={e} onClick={() => setEditIcon(e)}
                                        className={`text-sm cursor-pointer rounded px-0.5 ${editIcon === e ? "ring-2" : ""}`}
                                        style={{ ringColor: "var(--accent)" }}>{e}</button>
                                ))}
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={String(item.value)} className="flex items-center gap-1 group">
                        <button
                            onClick={() => onSelect(isActive ? null : item.value)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] flex-1"
                            style={isActive ? { background: "var(--accent)", color: "#fff" } : { background: "transparent", color: "var(--text)", opacity: 0.75 }}>
                            <span>{item.icon}</span>
                            <span className="flex-1 truncate">{item.label}</span>
                            <span className="text-xs font-mono opacity-70" style={{ color: isActive ? "#fff" : "var(--text)" }}>{item.count}</span>
                        </button>
                        {item.id && item.id !== "uncat" && (
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(item.id); setEditName(item.label); setEditIcon(item.icon); }}
                                    className="text-xs cursor-pointer" style={{ color: "var(--accent)" }}>✏️</button>
                                <button onClick={e => handleDelete(item.id, e)}
                                    className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}>✕</button>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Add new category */}
            {adding ? (
                <div className="flex flex-col gap-1 px-2 mt-1">
                    <div className="flex items-center gap-1">
                        <span className="text-sm">{newIcon}</span>
                        <input autoFocus value={newCat}
                            onChange={e => setNewCat(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                            placeholder="Category name"
                            className="flex-1 px-2 py-1 rounded-lg text-xs outline-none border"
                            style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--accent)" }}
                            
                        />
                        <button onClick={handleAdd} className="text-xs font-bold cursor-pointer" style={{ color: "var(--accent)" }}>✓</button>
                        <button onClick={() => setAdding(false)} className="text-xs cursor-pointer" style={{ color: "var(--danger)" }}>✕</button>

                    </div>
                    <div className="flex flex-wrap gap-1 px-1">
                        {EMOJI_OPTIONS.map(e => (
                            <button key={e} onClick={() => setNewIcon(e)}
                                className={`text-sm cursor-pointer rounded px-0.5 ${newIcon === e ? "ring-2 ring-violet-500" : ""}`}>{e}</button>
                        ))}
                    </div>
                </div>
            ) : (
                <button onClick={() => setAdding(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-300 hover:scale-[1.02] opacity-50 hover:opacity-100"
                    style={{ color: "var(--text)" }}>
                    + Add category
                </button>
            )}
        </div>
    );
}

export function CategoryStatsPanel({ tasks, visibleTasks, selectedCategory, onSelect, styles, customCats, onCatsChange }) {
    return (
        <div className="flex flex-col gap-4 w-44 shrink-0">
            <CategoryPanel tasks={tasks} selected={selectedCategory} onSelect={onSelect}
                customCats={customCats} onCatsChange={onCatsChange} />
            <div className="rounded-[14px] px-4 py-3.5 shadow-sm" style={styles.calendar}>
                <div className="text-center">
                    <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Total Tasks</span>
                    <div className="text-4xl font-bold font-mono mt-1">{visibleTasks.length}</div>
                </div>
                <div className="flex justify-center gap-4 mt-3">
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
    );
}

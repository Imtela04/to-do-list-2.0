const modalInput = "w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono outline-none transition-colors duration-500 focus:border-violet-600 resize-none";

const CATEGORIES = [
    { value: "",          label: "Select a category" },
    { value: "work",      label: "💼 Work" },
    { value: "personal",  label: "🏠 Personal" },
    { value: "health",    label: "💪 Health" },
    { value: "finance",   label: "💰 Finance" },
    { value: "education", label: "📚 Education" },
    { value: "other",     label: "📌 Other" },
];

function CategorySelect({ value, onChange, style }) {
    return (
        <select className={modalInput} style={style} value={value} onChange={onChange}>
            {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
            ))}
        </select>
    );
}

export function AddModal({ open, form, setForm, error, loading, onSubmit, onClose, styles }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                 style={styles.cardA}
                 onKeyDown={e => e.key === "Enter" && onSubmit(e)}>
                <h3 className="text-lg font-bold mb-2" style={styles.labelAlt}>Add Task</h3>
                {error && <p className="text-red-500 font-semibold text-sm mb-2">{error}</p>}

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Title</label>
                <input className={modalInput} style={styles.cardA}
                    value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Description (Optional)</label>
                <textarea rows={3} className={modalInput} style={styles.cardA}
                    value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Deadline (Optional)</label>
                <input type="datetime-local" className={modalInput} style={styles.cardA}
                    value={form.deadline}
                    min={new Date().toISOString().slice(0, 16)}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />

                <label className="text-xs font-semibold mt-1.5" style={styles.labelAlt}>Category (Optional)</label>
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

export function EditModal({ taskId, form, setForm, onSave, onClose, styles }) {
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

export function DeleteModal({ taskId, tasks, onConfirm, onClose }) {
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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ============================================================
// CONSTANTS
// ============================================================
const modalInput = "w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono outline-none transition-colors duration-500 focus:border-violet-600 resize-none";


// ============================================================
// HELPERS
// ============================================================
const pad = n => String(n).padStart(2, "0");

const toLocalDeadline = date => {
    if (!date) return "";
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ============================================================
// SHARED SUB-COMPONENTS
// ============================================================


function CategorySelect({ value, onChange, style, customCats = [] }) {
    const allOptions = [
        { value: "", label: "Select a category" },
        ...customCats.map(c => ({ value: c.name, label: `${c.icon || "🏷️"} ${c.name}` }))
    ];
    return (
        <select className={modalInput} style={style} value={value} onChange={onChange}>
            {allOptions.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
            ))}
        </select>
    );
}
function DeadlinePicker({ value, onChange, style }) {
    return (
        <DatePicker
            selected={value ? new Date(value) : null}
            onChange={date => onChange(toLocalDeadline(date))}
            showTimeSelect
            dateFormat="MM/dd/yyyy HH:mm"
            minDate={new Date()}
            className={modalInput}
            placeholderText="Select deadline"
            wrapperClassName="w-full"
        />
    );
}

function ModalShell({ onClose, style, onKeyDown, children }) {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative rounded-2xl p-8 w-full max-w-md shadow-xl flex flex-col gap-1.5 z-10"
                 style={style} onKeyDown={onKeyDown}>
                {children}
            </div>
        </div>
    );
}

function ModalActions({ onClose, onConfirm, confirmLabel, confirmStyle, closeStyle, disabled }) {
    return (
        <div className="flex gap-2.5 mt-4">
            <button onClick={onClose}
                className="flex-1 py-2.5 border-1 rounded-full font-semibold text-sm cursor-pointer transition-all duration-500 hover:bg-gray-200"
                style={closeStyle}>Cancel</button>
            <button onClick={onConfirm} disabled={disabled}
                className="flex-1 py-2.5 rounded-full font-semibold text-sm text-white cursor-pointer transition-all duration-500 disabled:opacity-60"
                style={confirmStyle}
                onMouseOver={e => e.currentTarget.style.background = "var(--accent-hover)"}
                onMouseOut={e => e.currentTarget.style.background = confirmStyle.background}>
                {confirmLabel}
            </button>
        </div>
    );
}

function FormField({ label, labelStyle, children }) {
    return (
        <>
            <label className="text-xs font-semibold mt-1.5" style={labelStyle}>{label}</label>
            {children}
        </>
    );
}

// ============================================================
// MODALS
// ============================================================
export function AddModal({ open, form, setForm, error, loading, onSubmit, onClose, styles, customCats = [] }) {    if (!open) return null;
    const update = field => e => setForm(p => ({ ...p, [field]: e?.target ? e.target.value : e }));

    return (
        <ModalShell onClose={onClose} style={styles.cardA} onKeyDown={e => e.key === "Enter" && onSubmit(e)}>
            <h3 className="text-lg font-bold mb-2" style={styles.labelAlt}>Add Task</h3>
            {error && <p className="text-red-500 font-semibold text-sm mb-2">{error}</p>}

            <FormField label="Title" labelStyle={styles.labelAlt}>
                <input className={modalInput} style={styles.cardA} value={form.title} onChange={update("title")} />
            </FormField>

            <FormField label="Description (Optional)" labelStyle={styles.labelAlt}>
                <textarea rows={3} className={modalInput} style={styles.cardA}
                    value={form.description} onChange={update("description")}
                    onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />
            </FormField>

            <FormField label="Deadline (Optional)" labelStyle={styles.labelAlt}>
                <DeadlinePicker value={form.deadline}
                    onChange={val => setForm(p => ({ ...p, deadline: val }))}
                    style={styles.cardA} />
            </FormField>

            <FormField label="Category (Optional)" labelStyle={styles.labelAlt}>
                <CategorySelect value={form.category} onChange={update("category")} style={styles.cardA} customCats={customCats}/>
            </FormField>

            <ModalActions
                onClose={onClose} onConfirm={onSubmit} disabled={loading}
                confirmLabel={loading ? "Adding..." : "Add Task"}
                confirmStyle={styles.accent} closeStyle={styles.cardA}
            />
        </ModalShell>
    );
}

export function EditModal({ taskId, form, setForm, onSave, onClose, styles, customCats = [] }) {    if (!taskId) return null;
    const update = field => e => setForm(p => ({ ...p, [field]: e?.target ? e.target.value : e }));

    return (
        <ModalShell onClose={onClose} style={styles.surface} onKeyDown={e => e.key === "Enter" && onSave()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: "var(--accent)" }}>Edit Task</h3>

            <FormField label="Title" labelStyle={styles.labelAlt}>
                <input className={modalInput} style={styles.surface} value={form.title} onChange={update("title")} />
            </FormField>

            <FormField label="Description" labelStyle={styles.labelAlt}>
                <textarea rows={3} className={modalInput} style={styles.surface}
                    value={form.description} onChange={update("description")}
                    onKeyDown={e => e.key === "Enter" && e.stopPropagation()} />
            </FormField>

            <FormField label="Deadline" labelStyle={styles.labelAlt}>
                <DeadlinePicker value={form.deadline}
                    onChange={val => setForm(p => ({ ...p, deadline: val }))}
                    style={styles.surface} />
            </FormField>

            <FormField label="Category" labelStyle={styles.labelAlt}>
                <CategorySelect value={form.category} onChange={update("category")} style={styles.surface} customCats={customCats} />
            </FormField>

            <ModalActions
                onClose={onClose} onConfirm={onSave}
                confirmLabel="Save"
                confirmStyle={styles.accent} closeStyle={styles.surface}
            />
        </ModalShell>
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
                    Are you sure you want to delete{" "}
                    <strong style={{ color: "var(--text)" }}>{task?.title}</strong>?
                    {" "}This cannot be undone.
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
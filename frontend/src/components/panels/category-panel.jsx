const CATEGORIES = [
    { value: "",          label: "Select a category" },
    { value: "work",      label: "💼 Work" },
    { value: "personal",  label: "🏠 Personal" },
    { value: "health",    label: "💪 Health" },
    { value: "finance",   label: "💰 Finance" },
    { value: "education", label: "📚 Education" },
    { value: "other",     label: "📌 Other" },
];

export default function CategoryPanel({ tasks, selected, onSelect, styles }) {
    const counts = {};
    CATEGORIES.slice(1).forEach(c => {
        counts[c.value] = tasks.filter(t => t.category === c.value).length;
    });
    const uncategorized = tasks.filter(t => !t.category).length;

    const items = [
        { value: null,           label: "All",           icon: "📋", count: tasks.length },
        ...CATEGORIES.slice(1).map(c => ({
            value: c.value,
            icon:  c.label.split(" ")[0],
            label: c.label.split(" ").slice(1).join(" "),
            count: counts[c.value] || 0,
        })),
        { value: "uncategorized", label: "Uncategorized", icon: "◯", count: uncategorized },
    ];

    return (
        <div className="flex flex-col gap-1 py-5 w-44 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2 opacity-100"
               >Categories</p>
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
    );
}
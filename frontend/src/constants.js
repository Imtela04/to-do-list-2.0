export const defaultDeadline = () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAY_NAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const CATEGORIES  = [
    { value: "",          label: "Select a category" },
    { value: "work",      label: "💼 Work" },
    { value: "personal",  label: "🏠 Personal" },
    { value: "health",    label: "💪 Health" },
    { value: "finance",   label: "💰 Finance" },
    { value: "education", label: "📚 Education" },
    { value: "other",     label: "📌 Other" },
];
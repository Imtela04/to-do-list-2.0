import Calendar from "../calendar";

export default function RightPanel({ tasks, time, today, styles, onDayClick }) {
    return (
        <div className="flex flex-col gap-5 w-70 shrink-0 py-13">

            {/* Clock */}
            <div className="rounded-2xl " style={{ ...styles.calendar, padding: "2em" }}>
                <div className="text-sm" style={{ color: "var(--calendar-text)" }}>
                    {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()} {today}
                </div>
                <div className="text-4xl font-medium tracking-tight whitespace-nowrap"
                     style={{ color: "var(--card-a-text)" }}>
                    {time}
                </div>
            </div>

            {/* Calendar */}
            <Calendar tasks={tasks} onDayClick={onDayClick} />

        </div>
    );
}
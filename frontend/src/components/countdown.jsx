import { useState, useEffect } from "react";

export function Countdown({ deadline }) {
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
        <span className="text-xs font-mono font-semibold" style={{color: timeLeft === "Overdue" ? "#ef4444" : "inherit"}}>
            ⏱ {timeLeft}
        </span>
    );
}

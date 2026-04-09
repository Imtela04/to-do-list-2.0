import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../App";
import { logout } from "../api";

export default function Navbar({ showLogout = false, username = null }) {
    const { isDark, setIsDark } = useContext(DarkModeContext);
    const navigate              = useNavigate();
    const [open,setOpen]        =useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="static w-full"
            style={{background:"var(--card-a)",padding:"2em 4em"}}>
                <h2 className="font-bold text-4xl" style={{color:"var(--card-b)"}}>what-do</h2>
            <div className="absolute top-0 right-2 z-50 flex items-center gap-2 py-2 font-semibold text-sm"
                style={{ color: "var(--card-b)" }}>
                <button
                    onClick={() => setIsDark(prev => !prev)}
                    className="bg-transparent border-none text-xl cursor-pointer transition-transform duration-500 hover:rotate-12 hover:scale-125"
                >
                    {isDark ? "☀️" : "🌙"}
                </button>

                {/* user dropdown */}
                {showLogout && username && (
                    <div className="relative">
                        <button onClick={()=>setOpen(prev=>!prev)} 
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm cursor-pointer transition-all duration-500"
                                style={{background: "var(--card-a)", color: "var(--card-a-text)" }}>
                                   {username}
                                   <span className="text-xs">{open?"▲" : "▼"}</span> 
                                </button>
                        {open &&(
                            <>
                                {/* backdrop to close on outside click */}
                                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                                <div
                                    className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden z-50"
                                    style={{ background: "var(--surface)", border: "1px solid rgba(0,0,0,0.08)" }}
                                >
                                    <div className="px-4 py-3 text-xs font-semibold border-b"
                                        style={{ color: "var(--text-muted)", borderColor: "rgba(0,0,0,0.08)" }}>
                                        Signed in as<br />
                                        <span style={{ color: "var(--text)", fontSize: "0.85rem" }}>{username}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-500 hover:bg-red-50 text-red-500"
                                    >
                                        ◯ Logout
                                    </button>
                                </div>
                            </>
                        )}      
                    </div>

                )}

            </div>
        </div>

    );
}
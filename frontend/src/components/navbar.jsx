import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DarkModeContext } from "../App";
import { logout } from "../api";

export default function Navbar({ showLogout = false, username = null }) {
    const { isDark, setIsDark } = useContext(DarkModeContext);
    const navigate              = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="static w-full"
            style={{background:"var(--card-a)",padding:"2em 4em"}}>
                <h2 className="font-bold text-4xl" style={{color:"var(--card-b)"}}>what-do</h2>
            <div className="absolute top-0 right-2 z-50 flex items-center py-2 font-semibold text-sm"
                style={{ color: "var(--card-b)" }}>
                {username && <span>{username}</span>}
                {showLogout && (
                    <button
                        onClick={handleLogout}
                        className="bg-transparent text-red-500 border-none px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600 hover:text-white hover:scale-105"
                    >
                        Logout
                    </button>
                )}
                <button
                    onClick={() => setIsDark(prev => !prev)}
                    className="bg-transparent border-none text-xl cursor-pointer transition-transform duration-200 hover:rotate-12 hover:scale-125"
                >
                    {isDark ? "☀️" : "🌙"}
                </button>

            </div>
        </div>
        
    );
}
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
        <div>
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 font-semibold text-sm"
                style={{ color: "var(--text)" }}>
                {username && <span>{username}</span>}
                <button
                    onClick={() => setIsDark(prev => !prev)}
                    className="bg-transparent border-none text-xl cursor-pointer px-1 py-0.5 rounded-full transition-transform duration-200 hover:rotate-12 hover:scale-125"
                >
                    {isDark ? "☀️" : "🌙"}
                </button>
                {showLogout && (
                    <button
                        onClick={handleLogout}
                        className="bg-transparent text-red-500 border-none px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600 hover:text-white hover:scale-105"
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
        
    );
}
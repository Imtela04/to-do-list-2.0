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
        <div className="user-info">
            {username && <span>Logged in as {username}</span>}
            <button id="dark-toggle" onClick={() => setIsDark(prev => !prev)}>
                {isDark ? "☀️" : "🌙"}
            </button>
            {showLogout && (
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            )}
        </div>
    );
}
import { useState, useEffect, createContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Index from "./pages/index";
import Add from "./pages/index";
import "./style.css";

export const DarkModeContext = createContext();

function PrivateRoute({ children }) {
    const token = localStorage.getItem("access_token");
    if (!token) return <Navigate to="/login" />;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("access_token");
            return <Navigate to="/login" />;
        }
    } catch {
        return <Navigate to="/login" />;
    }
    return children;
}

export default function App() {
    const [isDark, setIsDark] = useState(() => localStorage.getItem("darkMode") === "true");

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("darkMode", isDark);
    }, [isDark]);

    return (
        <DarkModeContext.Provider value={{ isDark, setIsDark }}>
            <Routes>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/"         element={<PrivateRoute><Index /></PrivateRoute>} />
            </Routes>
        </DarkModeContext.Provider>
    );
}
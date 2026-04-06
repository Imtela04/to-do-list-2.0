import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import Navbar from "../components/Navbar";

export default function Login() {
    const [form, setForm]       = useState({ username: "", password: "" });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const navigate              = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.username.trim() || !form.password.trim()) {
            setError("All fields are required");
            return;
        }

        setLoading(true);
        try {
            await login(form.username, form.password);
            navigate("/");
        } catch (err) {
            setError(err.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <Navbar />

            <div className="auth-card">
                <h1>Login</h1>

                {error && <p className="error">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        autoComplete="current-password"
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </div>
        </div>
    );
}
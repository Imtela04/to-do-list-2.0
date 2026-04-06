import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/Navbar";


export default function Register(){
    const[form, setForm]        =useState({ username:"", password:"", confirm:""});
    const[error, setError]      =useState("");
    const[loading, setLoading]  =useState(false);
    const{ isDark, setIsDark }  =useContext(DarkModeContext);
    const navigate              =useNavigate();

    const handleSubmit= async(e)=>{
        e.preventDefault();
        setError("");

        if (!form.username.trim() ||!form.password.trim() ||!form.confirm.trim()){
            setError("All fields required");
            return;
        }
        if (form.password!==form.confirm){
            setError("Passwords do not match")
            return;
        }
        if (form.password.length<6){
            setError("Password must be at least 6 characters")
            return;
        }
        setLoading(true);
        try{
            await register(form.username,form.password,confirm);
            navigate("/");
        }catch{
            setError(error.message || "Registration failed");
        }finally{
            setLoading(false);
        }
    };
    return(
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            {/* Dark toggle */}
            <Navbar />
            <div className="auth-card">
                <h1>Register</h1>

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
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={form.confirm}
                        onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                        autoComplete="new-password"
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                </form>

                <p>Already have an account? <Link to="/login">Login here</Link></p>
            </div>
        </div>
    );
}

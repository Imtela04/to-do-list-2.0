import { useState, useContext } from "react";
import { useNavigate  } from "react-router-dom";
import { addTask } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/navbar";

export default function Add(){
    const[form, setForm]        =useState({ title:"", description:"", deadline:"", category:""});
    const[error, setError]      =useState("");
    const[loading, setLoading]  =useState(false);
    // const{ isDark, setIsDark }  =useContext(DarkModeContext);
    const navigate              =useNavigate();

    const handleSubmit= async(e)=>{
        e.preventDefault();
        if (!form.title.trim()){
            setError("Title is required");
            return;
        }
        setLoading(true);
        try{
            await addTask(form.title,form.description,form.deadline,form.category);
            navigate("/");
        }catch(err){
            if (err.message.includes("409")){
                setError("Task already exists");
            }else{
                setError("Failed to add task")
            }
            
        }finally{
            setLoading(false);
        }
    };
    return(
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            {/* Dark toggle */}
            <Navbar />

            <form className="add-task-form" onSubmit={handleSubmit}>
                <h2>Add New Task</h2>

                {error && <p className="error">{error}</p>}

                <input
                    type="text"
                    placeholder="Task title"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                />
                <textarea
                    placeholder="Task description (optional)"
                    rows={4}
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
                <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                />
                <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                >
                    <option value="">Select a category</option>
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                </select>

                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Task"}
                </button>
                <button type="button" onClick={() => navigate("/")}>
                    Cancel
                </button>
            </form>
        </div>
    );
}
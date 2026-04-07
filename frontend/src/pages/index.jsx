import { useState, useEffect, useContext } from "react";
import { useNavigate  } from "react-router-dom";
import { getTasks, toggleTask, deleteTask, updateTaskCategory, updateTaskDeadline, updateTaskDescription, updateTaskTitle } from "../api";
import { DarkModeContext } from "../App";
import Navbar from "../components/navbar";
import Calendar from "../components/calendar";

export default function Index(){
    const [tasks, setTasks]             =useState([]);
    const [clickedCard, setClickedCard] =useState(null);
    const [editingTask, setEditingTask] =useState(null);
    const [editForm, setEditForm]    =useState({title:"",description:"",deadline:"",category:""});
    const { isDark } = useContext(DarkModeContext);
    const navigate                      =useNavigate();

    //get username from token
    const getUsername =()=>{
        const token = localStorage.getItem("access_token");
        if (!token) return null;
        try{
            return JSON.parse(atob(token.split(".")[1])).sub;
        }catch{return null;}
    };

    const isTokenExpired =()=>{
        const token = localStorage.getItem("access_token");
        if (!token) return true;
        try{
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp*1000<Date.now();
        }catch{
            return true;
        }
    };

    const refresh = async()=>{
        const data = await getTasks();
        if (data) setTasks(data);
    };

    useEffect(() => {
        if (!localStorage.getItem("access_token") || isTokenExpired()) {
            localStorage.removeItem("access_token"); // ✅ clean up expired token
            navigate("/login");
            return;
        }
        refresh();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isTokenExpired()) {
                localStorage.removeItem("access_token");
                navigate("/login");
            }
        }, 30000); // check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    //greeting
    const getGreeting = () => {
        const h = new Date().getHours();
        if (h >= 5  && h < 12) return { emoji: "🌅", text: "Good Morning",   sub: "Fresh start. Let's get it!" };
        if (h >= 12 && h < 17) return { emoji: "🌤️", text: "Good Afternoon", sub: "Keep up the momentum!" };
        if (h >= 17 && h < 24) return { emoji: "🌇", text: "Good Evening",   sub: "You're almost there!" };
        return                         { emoji: "🌙", text: "Good Night",     sub: "Recharge for tomorrow." };
    };

    //clock
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(interval);
    }, []);


    const handleToggle = async(id)=>{
        await toggleTask(id);
        refresh();
    };
    const handleDelete = async(id)=>{
        await deleteTask(id);
        refresh();
    };
    const handleCardClick = (id)=>{
        setClickedCard(prev=>prev===id?null:id);
    };
    const openEdit =(task)=>{
        setEditingTask(task.id);
        setEditForm({
            title:          task.title||"",
            description:    task.description||"",
            deadline:       task.deadline ? new Date(task.deadline).toISOString().slice(0,16):"",
            category:       task.category||""
        });

    };
    const saveEdit = async()=>{
        const task = tasks.find(t => t.id === editingTask);
        if (editForm.title       !== task.title)       await updateTaskTitle(editingTask, editForm.title);
        if (editForm.description && editForm.description !== task.description) await updateTaskDescription(editingTask, editForm.description);
        if (editForm.deadline && editForm.deadline    !== task.deadline)    await updateTaskDeadline(editingTask, editForm.deadline);
        if (editForm.category && editForm.category    !== task.category)    await updateTaskCategory(editingTask, editForm.category);
        setEditingTask(null);
        refresh();
    };

    const greeting = getGreeting();
    const cardColors = isDark
        ? ["blue", "purple"]
        : ["yellow", "purple"];

    return(
        <div className="full-page">
            {/* Hero */}
            <div className="left-panel">
                <div className="date-time">
                    <div id="today">{new Date().getDate()}/{new Date().getDay()}/{new Date().getFullYear()}</div>
                    <div id="digital-clock">{time}</div>
                </div>
                <Calendar tasks={tasks} />
            </div>
            <header className="hero">
                <h1>{greeting.emoji} {greeting.text}</h1>
                <p>{greeting.sub}</p>
            </header>

            {/* User info bar */}
            <Navbar showLogout username={getUsername()} />
            
            {/* Tasks */}
            <div className="tasks-container">
                
                {tasks.map((task, i) => (
                    <div
                        key={task.id}
                        className={`task-card ${cardColors[i % 2]} ${clickedCard === task.id ? "clicked" : ""}`}
                        onClick={() => handleCardClick(task.id)}
                    >
                        <div className={`task-title ${task.completed ? "done" : ""}`}>
                            {task.title}
                        </div>
                        <div className="task-actions">
                            <button onClick={e => { e.stopPropagation(); handleToggle(task.id); }}>
                                {task.completed ? "↩️" : "✅"}
                            </button>
                            <button onClick={e => { e.stopPropagation(); openEdit(task); }}>✏️</button>
                            <button onClick={e => { e.stopPropagation(); handleDelete(task.id); }}>🗑️</button>
                        </div>
                        <div className="task-preview">
                            <p>📝 {task.description || "No description"}</p>
                            <p>⏰ {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}</p>
                            <p>🏷️ {task.category || "No category"}</p>
                        </div>
                    </div>
                ))}

                <div className="task-count">
                    <div id="total">
                        <span>Total tasks</span>
                        <div className="count-value">{tasks.length}</div>
                    <div/>
                    <div id="completed">
                        <span>Completed</span>
                        <div className="count-value">{tasks.filter(t=>t.completed).length}</div>
                    </div>
                    <div id="remaining">
                        <span>Remaining</span>
                        <div className="count-value">{tasks.filter(t=>!t.completed).length}</div>
                    </div>
                </div>
                {/* Add button */}
                <button className="add-btn" onClick={() => navigate("/add")}>+</button> 

            </div>
        </div>

            
            {/* Edit modal */}
            {editingTask && (
                <div id="edit-modal" style={{ display: "flex" }}>
                    <div className="modal-overlay" onClick={() => setEditingTask(null)} />
                    <div className="modal-card">
                        <h3>Edit Task</h3>
                        <label>Title</label>
                        <input
                            value={editForm.title}
                            onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        />
                        <label>Description</label>
                        <textarea
                            rows={3}
                            value={editForm.description}
                            onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        />
                        <label>Deadline</label>
                        <input
                            type="datetime-local"
                            value={editForm.deadline}
                            onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))}
                        />
                        <label>Category</label>
                        <input
                            value={editForm.category}
                            onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                        />
                        <div className="modal-actions">
                            <button onClick={() => setEditingTask(null)}>Cancel</button>
                            <button onClick={saveEdit}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    


}
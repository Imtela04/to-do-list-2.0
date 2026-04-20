from fastapi import FastAPI, Depends, HTTPException, Form
# from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from backend.database import engine, Base, get_db
from backend.models import User, Todo, Category
from backend.schemas import UserPublic, Token
from backend.auth import hash_password, create_access_token, authenticate_user, get_current_user, create_user
from datetime import datetime

#app initialisation
#create db tables
Base.metadata.create_all(bind=engine)
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # ✅ creates all tables from models
    yield

app = FastAPI(title="FastAPI To-Do App", lifespan=lifespan)  # ✅ one app
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://imtela04.github.io",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#homepage route
#current user route
@app.get("/api/me", response_model=UserPublic)
def read_me(current_user: UserPublic = Depends(get_current_user)):
    return current_user

DEFAULT_CATEGORIES = [
    {"name": "work",      "icon": "💼"},
    {"name": "personal",  "icon": "🏠"},
    {"name": "health",    "icon": "💪"},
    {"name": "finance",   "icon": "💰"},
    {"name": "education", "icon": "📚"},
    {"name": "other",     "icon": "📌"},
]

#registration routes
@app.post("/api/register")
def register(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    hashed = hash_password(password)
    try:
        create_user(db, username, hashed)
    except HTTPException:
        raise HTTPException(status_code=400, detail="Username already taken")
    user = authenticate_user(db, username, password)
    # seed default categories
    for cat in DEFAULT_CATEGORIES:
        db.add(Category(name=cat["name"], icon=cat["icon"], owner_id=user.id))
    db.commit()
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "Bearer"}

#login routes
@app.post("/api/login", response_model=Token)
def login(username: str = Form(...), password:str = Form(...),db: Session=Depends(get_db)):
    #print(request,username,password)
    user = authenticate_user(db, username, password)  # ✅ pass db
    #print(user)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token({"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "Bearer"
    }

##handled client side via navbar
# #logout route
# @app.get("/logout")
# def logout():
#     response = RedirectResponse(url="/login", status_code=303)
#     response.delete_cookie("user_id")
#     return response


#task management routes
@app.get("/api/tasks")
def get_tasks(current_user: UserPublic = Depends(get_current_user), db:Session=Depends(get_db)):
    user = db.query(User).filter(User.username==current_user.username).first()
    return user.todos
# @app.post("/api/tasks")
@app.post("/api/tasks")
def add_task(
    current_user: UserPublic = Depends(get_current_user),
    title: str = Form(...),
    description: str = Form(""),
    deadline: str = Form(""),
    category: str = Form(""),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user.username).first()
    exist = db.query(Todo).filter(Todo.title == title, Todo.owner_id == user.id).first()
    if exist:
        raise HTTPException(status_code=409, detail="Task with this title already exists")
    task = Todo(
        title=title,
        owner_id=user.id,
        description=description if description else None,
        deadline=datetime.fromisoformat(deadline) if deadline else None,
        category=category if category else None
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task
@app.delete("/api/tasks/{task_id}")
def delete(task_id:int, current_user:UserPublic=Depends(get_current_user), db:Session=Depends(get_db)):
    
    user = db.query(User).filter(User.username==current_user.username).first()
    task = db.query(Todo).filter(Todo.id==task_id,Todo.owner_id==user.id).first()
    if not task:
        raise HTTPException(status_code=404,detail="Task not found")
    db.delete(task)
    db.commit()
    return {"ok":True}

# main.py

@app.patch("/api/tasks/{task_id}/title")
def update_task_title(
    task_id: int,
    title: str = Form(...),
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user.username).first()
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.title = title
    db.commit()
    db.refresh(task)
    return task
@app.patch("/api/tasks/{task_id}/description")
def update_task_description(
    task_id: int,
    description: str = Form(...),
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user.username).first()
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.description = description
    db.commit()
    db.refresh(task)
    return task

@app.patch("/api/tasks/{task_id}/deadline")
def update_task_deadline(
    task_id: int,
    deadline: str = Form(...),
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    user = db.query(User).filter(User.username == current_user.username).first()
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    parsed = datetime.fromisoformat(deadline)
    
    task.deadline = parsed
    db.commit()
    db.refresh(task)
    
    return task

@app.patch("/api/tasks/{task_id}/category")
def update_task_category(
    task_id: int,
    category: str = Form(...),
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user.username).first()
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.category = category
    db.commit()
    db.refresh(task)
    return task

@app.patch("/api/tasks/{task_id}/toggle")
def toggle_task(
    task_id: int,
    current_user: UserPublic = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == current_user.username).first()
    task = db.query(Todo).filter(Todo.id == task_id, Todo.owner_id == user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.completed = not task.completed   # backend handles the flip, no bool parsing needed
    db.commit()
    db.refresh(task)
    return task

@app.get("/api/categories")
def get_categories(current_user=Depends(get_current_user), db=Depends(get_db)):
    user = db.query(User).filter(User.username == current_user.username).first()
    return user.categories

@app.post("/api/categories", status_code=201)
def add_category(name: str = Form(...), icon: str = Form("🏷️"), current_user=Depends(get_current_user), db=Depends(get_db)):
    user = db.query(User).filter(User.username == current_user.username).first()
    cat = Category(name=name, icon=icon, owner_id=user.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@app.patch("/api/categories/{cat_id}")
def update_category(cat_id: int, name: str = Form(...), icon: str = Form(None), current_user=Depends(get_current_user), db=Depends(get_db)):
    user = db.query(User).filter(User.username == current_user.username).first()
    cat = db.query(Category).filter(Category.id == cat_id, Category.owner_id == user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    cat.name = name
    if icon: cat.icon = icon
    db.commit()
    db.refresh(cat)
    return cat

@app.delete("/api/categories/{cat_id}")
def delete_category(cat_id: int, current_user=Depends(get_current_user), db=Depends(get_db)):
    user = db.query(User).filter(User.username == current_user.username).first()
    cat = db.query(Category).filter(Category.id == cat_id, Category.owner_id == user.id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"ok": True}


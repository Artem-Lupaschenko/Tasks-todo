from database import *
from sqlalchemy.orm import Session
from fastapi import Depends, FastAPI, Body, Request
from fastapi.responses import JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime
import jwt

# Створення всіх таблиць в базі даних
Base.metadata.create_all(bind=engine)

# Ініціалізація FastAPI додатку
app = FastAPI()

# Ініціалізація HTTPBearer для аутентифікації
security = HTTPBearer()

# Підключення статичних файлів
app.mount("/public", StaticFiles(directory="public"), name="public")

# Ініціалізація шаблонів Jinja2
templates = Jinja2Templates(directory="public")

# Секретний ключ для JWT
SECRET_KEY = "9a&!93c5Dbg#2pAs^eY9r!vZ"

# Функція для отримання сесії бази даних
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Маршрут для головної сторінки
@app.get("/")
def main(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Маршрут для отримання задач користувача
@app.get("/api/tasks")
def get_tasks(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    result = []
    if not requesting_user:
        return result
    result = [
        {"id": task.id, "name": task.name, "date": task.date, "time": task.time, "pomodoro": task.pomodoro, "done": task.done}
        for task in db.query(Task).filter(Task.user_id == requesting_user.id).all()
    ]
    return result

# # Маршрут для отримання задачі за id
# @app.get("/api/tasks/{id}")
# def get_task(id, token: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
#     requesting_user = get_requesting_user(token, db)
#     task = db.query(Task).filter(Task.id == id).first()
#     if task == None:
#         return JSONResponse(status_code=404, content={ "message": "Задача не знайдена"})
#     return task

# Маршрут для створення нової задачі
@app.post("/api/tasks")
def create_task(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    
    if not requesting_user:
        return
    
    task = Task(user_id=requesting_user.id)
    
    data = {k: (v if v else None) for k, v in data.items()}
    
    task.name = data["name"]
    
    task_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    today_date = datetime.today().date()
    
    if task_date >= today_date:
        task.date = data["date"]   

    task.time = data["time"]
    if int(data["pomodoro"]) >= 0: 
        task.pomodoro = data["pomodoro"]
    task.done = data["done"]
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"id": task.id, "name": task.name, "date": task.date, "time": task.time, "pomodoro": task.pomodoro}

# Маршрут для редагування задачі
@app.put("/api/tasks")
def edit_task(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    
    if not requesting_user:
        return
    
    task = db.query(Task).filter(Task.id == data["id"]).first()

    if task == None or requesting_user.id != task.user_id:
        return JSONResponse(status_code=404, content={"message": "Задача не знайдена"})

    if data["name"]: 
        task.name = data["name"]
    
    task_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
    today_date = datetime.today().date()
    
    if task_date >= today_date:
        task.date = data["date"]       
    
    if data["time"]:
        task.time = data["time"]
    else:
        task.time = None
        
    if int(data["pomodoro"]) >= 0: 
        task.pomodoro = data["pomodoro"]
    task.done = data["done"]
    
    db.commit() 
    db.refresh(task)
    return task

# Маршрут для видалення задачі за id
@app.delete("/api/tasks/{id}")
def delete_task(
    id,
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    
    if not requesting_user:
        return
    
    task = db.query(Task).filter(Task.id == id).first()

    if task == None or requesting_user.id != task.user_id:
        return JSONResponse(status_code=404, content={"message": "Задача не знайдена"})
    db.delete(task) 
    db.commit() 
    return task

# Маршрут для видалення всіх задач (доступно лише адміністратору)
@app.delete("/api/tasks")
def delete_tasks(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    if requesting_user.role != "admin":
        return JSONResponse(
            status_code=403, content={"message": "Недостатньо прав доступу"}
        )
    tasks = db.query(Task).all()
    for task in tasks:
        db.delete(task)

    db.commit()
    return tasks

# Маршрут для отримання інформації про користувача
@app.get("/api/users/")
def get_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    return {"username": requesting_user.username}

# Маршрут для отримання користувача за id (доступно лише адміністратору)
@app.get("/api/users/{id}")
def get_user_by_id(
    id,
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    if requesting_user.role != "admin":
        return JSONResponse(
            status_code=403, content={"message": "Недостатньо прав доступу"}
        )

    user = db.query(User).filter(User.id == id).first()

    if user == None:
        return JSONResponse(
            status_code=404, content={"message": "Користувач не знайдений"}
        )

    return user

# Маршрут для редагування інформації про користувача
@app.put("/api/users/")
def edit_user(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    requesting_user = get_requesting_user(token, db)

    requesting_user.username = data["username"]

    db.commit() 
    db.refresh(requesting_user)
    return requesting_user

# Маршрут для зміни логіну користувача
@app.put("/api/users/change-login")
def edit_user_login(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
 
    requesting_user = get_requesting_user(token, db)

    requesting_user.login = data["login"]

    db.commit()  
    db.refresh(requesting_user)
    return requesting_user

# Маршрут для зміни пароля користувача
@app.put("/api/users/change-password")
def edit_user_password(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    requesting_user = get_requesting_user(token, db)

    if not requesting_user.verify_password(data["oldPassword"]):
        return JSONResponse(status_code=401, content={"message": "Невірний пароль"})

    requesting_user.hashed_password = requesting_user.get_password_hash(
        data["newPassword"]
    )

    db.commit()  
    db.refresh(requesting_user)
    return requesting_user

# Маршрут для редагування інформації про користувача за id (доступно лише адміністратору)
@app.put("/api/users/{id}")
def edit_user_by_id(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):

    requesting_user = get_requesting_user(token, db)
    if requesting_user.role != "admin":
        return JSONResponse(
            status_code=403, content={"message": "Недостатньо прав доступу"}
        )

    user = db.query(User).filter(User.id == id).first()

    if user == None:
        return JSONResponse(
            status_code=404, content={"message": "Користувач не знайдений"}
        )

    user.username = data["username"]
    user.role = data["role"]

    db.commit()  
    db.refresh(user)
    return user

# Маршрут для входу користувача
@app.post("/api/users/login")
def login_user(data=Body(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == data["login"]).first()
    if user == None:
        return JSONResponse(
            status_code=404, content={"message": "Користувач не знайдений"}
        )
    if not user.verify_password(data["password"]):
        return JSONResponse(status_code=401, content={"message": "Невірний пароль"})

    token_payload = {"id": user.id}
    jwt_token = generate_jwt(token_payload)

    return {"access_token": jwt_token}

# Маршрут для реєстрації нового користувача
@app.post("/api/users/register")
def create_user(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    for key in data:
        if not key:
            return JSONResponse(
                status_code=400, content={"message": "Не всі дані введені"}
            )
    requesting_user = get_requesting_user(token, db)
    user = db.query(User).filter(User.login == data["login"]).first()
    if user:
        return JSONResponse(
            status_code=400, content={"message": "Користувач вже існує"}
        )
    user = User(username=data["username"], login=data["login"])
    if data["role"] == "admin" and requesting_user.role != "admin":
        return JSONResponse(
            status_code=403, content={"message": "Недостатньо прав доступу"}
        )
    else:
        user.role = data["role"]
    user.hashed_password = user.get_password_hash(data["password"])
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# Маршрут для перевірки, чи є користувач адміністратором
@app.get("/api/users/is-admin")
def is_admin(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    if requesting_user.role == "admin":
        return True
    return False

# Маршрут для видалення користувача
@app.delete("/api/users/")
def delete_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)

    db.delete(requesting_user) 
    db.commit()  
    return requesting_user

# Маршрут для видалення користувача за id (доступно лише адміністратору)
@app.delete("/api/users/{id}")
def delete_user_by_id(
    id,
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)

    if requesting_user.role != "admin":
        return JSONResponse(
            status_code=403, content={"message": "Недостатньо прав доступу"}
        )

    user = db.query(User).filter(User.id == id).first()

    if user == None:
        return JSONResponse(
            status_code=404, content={"message": "Користувач не знайдений"}
        )

    db.delete(user)  
    db.commit()  
    return user

# Маршрут для отримання статистики користувача
@app.get("/api/statistics")
def get_statistics(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)
    result = []

    if not requesting_user:
        return result

    statistics = (
        db.query(Statistic.task_id, func.sum(Statistic.spent_time), Task.name)
        .outerjoin(Task, Statistic.task_id == Task.id)
        .filter(Statistic.user_id == requesting_user.id)
        .group_by(Statistic.task_id)
        .all()
    )

    result = [
        {"task_id": task_id, "task_name": task_name, "spent_time": spent_time}
        for task_id, spent_time, task_name in statistics
    ]

    return result

# Маршрут для додавання статистики
@app.post("/api/statistics")
def add_statistic(
    data=Body(),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    requesting_user = get_requesting_user(token, db)

    if not requesting_user:
        return {"task_id": None, "task_name": DEFAULT_NAME, "spent_time": data["spentTime"]}

    statistic = Statistic(spent_time=data["spentTime"], user_id=requesting_user.id)
    
    if "taskId" in data:
        statistic.task_id = data["taskId"]
      
    db.add(statistic)
    db.commit()
    db.refresh(statistic)
    
    statistic_data = (
        db.query(Statistic.task_id, func.sum(Statistic.spent_time), Task.name)
        .outerjoin(Task, Statistic.task_id == Task.id)
        .filter(Statistic.user_id == requesting_user.id)
        .filter(Statistic.task_id == statistic.task_id)
        .group_by(Statistic.task_id)
        .first()
    )
    
    task_id, spent_time, task_name = statistic_data
    return {"task_id": task_id, "task_name": task_name, "spent_time": spent_time}

# Функція для отримання користувача, який робить запит, на основі JWT токена
def get_requesting_user(token, db):
    payload = verify_jwt(token.credentials)
    if payload:
        return db.query(User).filter(User.id == payload["id"]).first()
    return None

# Функція для генерації JWT токена
def generate_jwt(payload):
    payload["iat"] = datetime.utcnow()

    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return token

# Функція для верифікації JWT токена
def verify_jwt(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Функція для створення початкового адміністратора
def create_initial_admin(db: Session):
    initial_admin = User(username="admin", login="admin", role="admin")
    initial_admin.hashed_password = initial_admin.get_password_hash("12345")
    db.add(initial_admin)
    db.commit()

# Функція для ініціалізації бази даних
def init(db: Session):
    admin = db.query(User).filter(User.login == "admin").first()
    if not admin:
        create_initial_admin(db)

# Ініціалізація бази даних
init(SessionLocal())

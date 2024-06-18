from sqlalchemy import create_engine, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Column, Integer, String, Boolean
from passlib.context import CryptContext
from datetime import datetime

# Значення за замовчуванням для полів Task
DEFAULT_NAME = "Задача"
DEFAULT_DATE = datetime.today().strftime("%Y-%m-%d")
DEFAULT_TIME = "00:00"
DEFAULT_POMODORO = 0

# URL бази даних для SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# Створення SQLAlchemy двигуна з URL бази даних SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Ініціалізація контексту для хешування і перевірки паролів
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Базовий клас для моделей ORM
Base = declarative_base()

# Визначення моделі User з відповідними стовпцями таблиці та зв'язками
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)  # Первинний ключ
    username = Column(String)  # Стовпець імені користувача
    login = Column(String, unique=True)  # Стовпець логіна, має бути унікальним
    hashed_password = Column(String)  # Стовпець хешованого пароля
    role = Column(String, default="user")  # Стовпець ролі з значенням за замовчуванням "user"
    
    # Зв'язок з моделлю Task, з каскадним видаленням
    tasks = relationship("Task", cascade="all, delete")
    
    # Зв'язок з моделлю Statistic, з каскадним видаленням
    statistics = relationship("Statistic", cascade="all, delete")

    # Метод для перевірки пароля за допомогою хешованого пароля
    def verify_password(self, password: str):
        return pwd_context.verify(password, self.hashed_password)

    # Метод для генерації хешу пароля
    def get_password_hash(self, password: str):
        return pwd_context.hash(password)

# Визначення моделі Task з відповідними стовпцями таблиці та зв'язками
class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)  # Первинний ключ
    name = Column(String, default=DEFAULT_NAME)  # Назва задачі зі значенням за замовчуванням
    date = Column(String, default=DEFAULT_DATE)  # Дата задачі зі значенням за замовчуванням
    time = Column(String, default=DEFAULT_TIME)  # Час задачі зі значенням за замовчуванням
    pomodoro = Column(Integer, default=DEFAULT_POMODORO)  # Кількість помодоро зі значенням за замовчуванням
    done = Column(Boolean)  # Булеве значення для позначення, чи виконана задача
    user_id = Column(Integer, ForeignKey("users.id"))  # Зовнішній ключ до моделі User
    
    # Зв'язок з моделлю Statistic, з каскадним видаленням
    statistics = relationship("Statistic", cascade="all, delete")

# Визначення моделі Statistic з відповідними стовпцями таблиці та зв'язками
class Statistic(Base):
    __tablename__ = "statistics"
    id = Column(Integer, primary_key=True, index=True)  # Первинний ключ
    spent_time = Column(Integer)  # Час, витрачений на задачу
    task_id = Column(Integer, ForeignKey("tasks.id"))  # Зовнішній ключ до моделі Task
    user_id = Column(Integer, ForeignKey("users.id"))  # Зовнішній ключ до моделі User

# Створення sessionmaker для керування сесіями
SessionLocal = sessionmaker(autoflush=False, bind=engine)

from celery import Celery

celery = Celery(
    "battle_command_ai",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["backend.tasks.tasks"]
)
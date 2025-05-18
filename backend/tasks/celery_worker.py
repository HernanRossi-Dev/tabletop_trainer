from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../../.env'))


celery = Celery(
    "battle_command_ai",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["tasks.tasks"]
)
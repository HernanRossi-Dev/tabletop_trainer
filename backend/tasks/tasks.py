from .celery_worker import celery
from src.app import app as source
from models.Interaction import Interaction

@celery.task
def log_interaction_task(user_id, user_message, response, interaction_type="text"):
    db = source.db
    new_interaction = Interaction(
        user_id=user_id,
        type=interaction_type,
        user_input=user_message,
        llm_output=response
    )
    try:
        db.session.add(new_interaction)
        db.session.commit()
    except Exception as e:
        db.session.rollback()

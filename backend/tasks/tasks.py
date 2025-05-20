from backend.src.app import app as source
from backend.models.Interaction import Interaction
from backend.tasks.celery_worker import celery

@celery.task
def log_interaction_task(user_id, user_message, response, interaction_type="text"):
    with source.flask.app_context():
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

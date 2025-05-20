import uuid
from datetime import datetime
from backend.src.app import app
from sqlalchemy.dialects.postgresql import UUID, JSONB

class Interaction(app.db.Model):
    __tablename__ = 'interactions'

    # Columns
    id = app.db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = app.db.Column(UUID(as_uuid=True), app.db.ForeignKey('users.id'), nullable=False, index=True) # Foreign key to users table
    type = app.db.Column(app.db.String(50), nullable=False) # 'initial', 'text', 'image'
    timestamp = app.db.Column(app.db.DateTime, nullable=False, default=datetime.now(), index=True)
    user_input = app.db.Column(app.db.Text, nullable=True) # Store user text or filename
    llm_output = app.db.Column(app.db.Text, nullable=True) # Store LLM response
    context = app.db.Column(JSONB, nullable=True) # Store arbitrary JSON context (e.g., initial setup)

    def __repr__(self):
        return f'<Interaction {self.id} (User: {self.user_id}, Type: {self.type})>'

    # Helper to convert model to dictionary
    def to_dict(self):
        return {
            "interaction_id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type,
            "timestamp": self.timestamp.isoformat(),
            "user_input": self.user_input,
            "llm_output": self.llm_output,
            "context": self.context # JSONB is directly serializable
        }
print(f"--- MODEL LOADED: {Interaction.__name__} (Table: {Interaction.__tablename__}) ---") # <--- ADD THIS
import uuid
from datetime import datetime
from ..src.app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB

class Interaction(db.Model):
    __tablename__ = 'interactions'

    # Columns
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True) # Foreign key to users table
    type = db.Column(db.String(50), nullable=False) # 'initial', 'text', 'image'
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now(), index=True)
    user_input = db.Column(db.Text, nullable=True) # Store user text or filename
    llm_output = db.Column(db.Text, nullable=True) # Store LLM response
    context = db.Column(JSONB, nullable=True) # Store arbitrary JSON context (e.g., initial setup)

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
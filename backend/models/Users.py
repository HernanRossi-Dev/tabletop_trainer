import uuid
from datetime import datetime
from ..app import db
from sqlalchemy.dialects.postgresql import UUID, JSONB

class Users(db.Model):
    __tablename__ = 'users'

    # Columns
    # Use primary_key=True for UUID
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True) # Allow email to be optional
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.now(), index=True) # Store creation time

    # Relationship (optional but useful) - one-to-many: User can have many interactions
    interactions = db.relationship('Interaction', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.username} (ID: {self.id})>'

    # Helper to convert model to dictionary for JSON response
    def to_dict(self):
        return {
            "user_id": str(self.id), # Convert UUID to string for JSON
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() # Use ISO format for dates
        }
print(f"--- MODEL LOADED: {Users.__name__} (Table: {Users.__tablename__}) ---") # <--- ADD THIS
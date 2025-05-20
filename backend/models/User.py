import uuid
from datetime import datetime
from backend.src.app import app
from sqlalchemy.dialects.postgresql import UUID

class User(app.db.Model):
    __tablename__ = 'users'

    # Columns
    # Use primary_key=True for UUID
    id = app.db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = app.db.Column(app.db.String(80), unique=True, nullable=False)
    email = app.db.Column(app.db.String(120), unique=True, nullable=True) # Allow email to be optional
    created_at = app.db.Column(app.db.DateTime, nullable=False, default=datetime.now(), index=True) # Store creation time
    profile_picture = app.db.Column(app.db.String, nullable=True)  # Store URL or path to profile picture

    # Relationship (optional but useful) - one-to-many: User can have many interactions
    interactions = app.db.relationship('Interaction', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.username} (ID: {self.id})>'

    # Helper to convert model to dictionary for JSON response
    def to_dict(self):
        return {
            "user_id": str(self.id), # Convert UUID to string for JSON
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(), # Use ISO format for dates
            "profile_picture": str(self.profile_picture)
        }
print(f"--- MODEL LOADED: {User.__name__} (Table: {User.__tablename__}) ---") # <--- ADD THIS
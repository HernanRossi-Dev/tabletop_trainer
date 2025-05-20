import json
import uuid
from datetime import datetime
from backend.src.app import app
from sqlalchemy.dialects.postgresql import UUID

class Battle(app.db.Model):
    __tablename__ = 'battles'

    # Columns
    id = app.db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battle_name = app.db.Column(app.db.String(50), nullable=False) # The name of the battle
    user_id = app.db.Column(UUID(as_uuid=True), app.db.ForeignKey('users.id'), nullable=False, index=True) # Foreign key to users table
    width = app.db.Column(app.db.String(50), nullable=False) # The width of the battlefield
    height = app.db.Column(app.db.String(50), nullable=False) # The height of the battlefield
    player_army = app.db.Column(app.db.JSON, nullable=False)
    opponent_army = app.db.Column(app.db.JSON, nullable=True)
    battle_round = app.db.Column(app.db.Text, nullable=True) # Store what the current round is
    army_turn = app.db.Column(app.db.Text, nullable=True) 
    player_score = app.db.Column(app.db.Text, nullable=True) # Store the points of the player
    opponent_score = app.db.Column(app.db.Text, nullable=True) # Store the points of the opponent
    archived = app.db.Column(app.db.Boolean, default=False) # Archive the battle
    timestamp = app.db.Column(app.db.DateTime, nullable=False, default=datetime.now(), index=True)
    battle_log = app.db.Column(app.db.JSON, nullable=False)
    """
    The battle log will contain all of the chat history the user had with the model this will be stored in Dict
    {   
        1: { // The key is the message number
            "creator": "user", // The creator of the message
            "message": "message",   // The message itself
            "timestamp": "timestamp"
        },
        2: {
            "creator": "agent",
            "message": "message",
            "timestamp": "timestamp"
        }
    }
    """
    # Relationships
    def __repr__(self):
        return f'<Battle {self.battle_name} (User: {self.user_id}, ID: {self.id})>'

    # Helper to convert model to dictionary
    def to_dict(self):
        return {
            "id": str(self.id),
            "battle_name": str(self.battle_name),
            "user_id": str(self.user_id),
            "width": self.width,
            "height": self.height,
            "player_army": json.dumps(self.player_army) if isinstance(self.player_army, dict) else self.player_army,
            "opponent_army": json.dumps(self.opponent_army) if isinstance(self.opponent_army, dict) else self.opponent_army,
            "battle_round": self.battle_round,
            "army_turn": self.army_turn,
            "player_score": self.player_score,
            "opponent_score": self.opponent_score,
            "battle_log": json.dumps(self.opponent_army) if isinstance(self.opponent_army, dict) else self.opponent_army,
            "archived": self.archived, 
            "timestamp": self.timestamp.isoformat(),
        }
    
print(f"--- MODEL LOADED: {Battle.__name__} (Table: {Battle.__tablename__}) ---") # <--- ADD THIS

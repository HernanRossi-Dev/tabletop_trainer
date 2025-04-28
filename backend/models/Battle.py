import json
import uuid
from datetime import datetime
from ..app import db
from sqlalchemy.dialects.postgresql import UUID

class Battle(db.Model):
    __tablename__ = 'battles'

    # Columns
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    battle_name = db.Column(db.String(50), nullable=False) # The name of the battle
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True) # Foreign key to users table
    width = db.Column(db.String(50), nullable=False) # The width of the battlefield
    height = db.Column(db.String(50), nullable=False) # The height of the battlefield
    player_army = db.Column(db.JSON, nullable=False)
    opponent_army = db.Column(db.JSON, nullable=True)
    battle_round = db.Column(db.Text, nullable=True) # Store what the current round is
    army_turn = db.Column(db.Text, nullable=True) 
    player_points = db.Column(db.Text, nullable=True) # Store the points of the player
    opponent_points = db.Column(db.Text, nullable=True) # Store the points of the opponent
    archived = db.Column(db.Boolean, default=False) # Archive the battle
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now(), index=True)

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
            "player_points": self.player_points,
            "opponent_points": self.opponent_points,
            "archived": self.archived,  # <-- add this line
            "timestamp": self.timestamp.isoformat(),
        }
    
print(f"--- MODEL LOADED: {Battle.__name__} (Table: {Battle.__tablename__}) ---") # <--- ADD THIS

from datetime import datetime
import json

from flask import jsonify
from backend.src.app import app
from backend.models.Battle import Battle

db = app.db
log = app.log

class BattleState:
    _battle: Battle
    
    def __init__(self, battle_id: str):
        self._battle = db.session.get(Battle, battle_id)

    @property
    def battle(self):
        """
        Returns the battle details
        """
        return self._battle.to_dict()
    
    @property
    def player_army(self):
        """
        Returns the player army details
        """
        return self._battle.player_army
    
    @property
    def opponent_army(self):
        """
        Returns the opponent army details
        """
        return self._battle.opponent_army

    @property
    def battle_log(self):
        """
        Returns the battle log
        """
        return self._battle.battle_log
    
    def update_battle_log(self, message: str, creator: str):
        """
        Updates the battle log with a new message
        """
        if self.battle_log is None:
            self.battle_log = {}
        message_id = len(self.battle_log) + 1

        log.info(f"Updating battle log for battle {self.battle_log} \n with message: {message=}, {message_id=}")

        self.battle_log[message_id] = {
            "creator": creator,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        db.session.commit()

    @property
    def get_model_formated_battle_log(self):
        """
        Returns the battle log in a format that the model can understand
        Example: {
            "role": "model",
            "parts": [{"text": "Acknowledged. 'Only War' it is. My Warlord is a Necron Overlord. We will now create the battlefield as per page 59."}]
        }
        """
        formatted_log = []
        for message in self._battle.battle_log.values():
            formatted_log.append({
                "role": message["creator"],
                "parts": [{"text": message["message"]}]
            })
        return formatted_log.strip()
    
    def get_battle_armies(battle_id):
        """
        Returns the player and opponent army details for a given battle.
        """
        battle = app.db.session.get(Battle, battle_id)
        if battle is None:
            return jsonify({"error": "Battle not found"}), 404

        # If armies are stored as JSON strings, parse them
        try:
            player_army = battle.player_army
            opponent_army = battle.opponent_army
            if isinstance(player_army, str):
                player_army = json.loads(player_army)
            if isinstance(opponent_army, str):
                opponent_army = json.loads(opponent_army)
        except Exception as e:
            app.flask.logger.info(f"Error parsing army details: {e}")
        return {
            "player_army": player_army,
            "opponent_army": opponent_army
        }
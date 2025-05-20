from datetime import datetime
import json
from typing import Dict

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
    def battle_id(self):
        """
        Returns the battle ID
        """
        return str(self._battle.id)
    
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
    
    @staticmethod
    def stringify_keys(d):
        return {str(k): v for k, v in d.items()}

    def update_battle_log(self, user_message: str, ai_response: str):
        battle = db.session.get(Battle, self.battle_id)
        if battle.battle_log is None:
            battle.battle_log = {}
        user_message_id = len(battle.battle_log)
        ai_message_id = user_message_id + 1
        interaction = {
            user_message_id: {
                "creator": 'user',
                "message": user_message,
                "timestamp": datetime.now().isoformat()
            },
            ai_message_id: {
                "creator": 'ai',
                "message": ai_response,
                "timestamp": datetime.now().isoformat()
            }
        }
        battle.battle_log.update(interaction)
        db.session.commit()
        return battle.battle_log

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
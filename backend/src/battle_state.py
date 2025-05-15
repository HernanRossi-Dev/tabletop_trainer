from datetime import datetime
from backend.src.app import app
from backend.models.Battle import Battle

class BattleState:
    _battle: Battle
    
    def __init__(self, battle_id: str):
        self._battle = app.db.session.get(Battle, battle_id)

    def battle(self):
        """
        Returns the battle details
        """
        return self._battle.to_dict()
    
    def player_army(self):
        """
        Returns the player army details
        """
        return self._battle.player_army
    
    def opponent_army(self):
        """
        Returns the opponent army details
        """
        return self._battle.opponent_army
    
    def battle_log(self):
        """
        Returns the battle log
        """
        return self._battle.battle_log
    
    def update_battle_log(self, message: str, creator: str):
        """
        Updates the battle log with a new message
        """
        if self._battle.battle_log is None:
            self._battle.battle_log = {}
        message_id = len(self._battle.battle_log) + 1
        self._battle.battle_log[message_id] = {
            "creator": creator,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        app.db.session.commit()

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
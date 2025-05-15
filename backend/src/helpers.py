import os
import jwt
import json

from flask import request, jsonify

from backend.models.Battle import Battle
from backend.src.battle_state import BattleState
from backend.src.parameters import JWT_SECRET, JWT_ALGORITHM
from backend.src.app import app

def get_jwt_identity():
    auth_header = request.headers.get("Authorization")
    if request.method == 'OPTIONS':
        return 'OPTIONS'
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload  # Contains user_id, email, etc.
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
from functools import wraps

def jwt_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if request.method == 'OPTIONS':
            return '', 204
        identity = get_jwt_identity()
        if not identity:
            return jsonify({"error": "Unauthorized"}), 401
        return f(identity, *args, **kwargs)
    return decorated_function

def get_battle_by_id(battle_id: str) -> Battle:
    """
    Returns the battle details for a given battle ID.
    """
    battle = app.db.session.get(Battle, battle_id)
    if battle is None:
        return jsonify({"error": "Battle not found"}), 404
    return battle.to_dict()

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

def read_rules_file():
    rules_path = os.path.join(os.path.dirname(__file__), "../instructions/rules.txt")
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        app.flask.logger.info(f"Error reading rules.txt: {e}")
        return ""
    

def get_system_instructions(battle_state: BattleState) -> str:
    system_instructions =  [
        "*****Your Instructions********", 
        "You are an AI Oppenent for a Player who wants to play a practive game of Warhammer 40K. YOu are an expert of the latest rules for all factions and detachments of 40K. You will speak to your oppenent as an experienced commander in the 40K universe.",
        f"Your Opponent is playing {battle_state.player_army} and you are playing {battle_state.opponent_army}.\n",
        f"************** Here is the current history of the battle messages: {battle_state.battle_log}.\n\n",
        f"Here are the rules for the game: {read_rules_file()}\n"
     ]
    return "\n".join(system_instructions)
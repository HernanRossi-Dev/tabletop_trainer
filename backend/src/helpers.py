import jwt
from flask import request, jsonify

from backend.models.Battle import Battle
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
    except Exception as e:
        app.log.error(f"JWT decode error: {e}")
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



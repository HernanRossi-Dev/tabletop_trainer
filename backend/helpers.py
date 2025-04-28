import jwt
from flask import request, jsonify

from backend.parameters import JWT_SECRET, JWT_ALGORITHM


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
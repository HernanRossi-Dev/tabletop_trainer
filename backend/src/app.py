import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

flask = Flask(__name__)
CORS(flask, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# Set up logging to file
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
flask.logger.addHandler(file_handler)
# Set up logging to console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)
flask.logger.addHandler(console_handler)


db_url = os.getenv('DATABASE_URL')
if not db_url:
    raise ValueError("No DATABASE_URL set for Flask application. Please set it in .env file.")

flask.config['SQLALCHEMY_DATABASE_URI'] = db_url
flask.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking overhead


class App:

    _flask: Flask
    _db: SQLAlchemy
    _battle_state: 'BattleState'  # Use a forward reference for type hinting

    def __init__(self):
        self._flask = flask
        self._db = SQLAlchemy(flask)
    
    @property
    def flask(self):
        return self._flask
    
    @property
    def db(self):
        return self._db
    
    def set_battle_state(self, battle_state: 'BattleState'):
        from backend.src.battle_state import BattleState  # Import here to avoid circular import
        self._battle_state = battle_state

    def battle_state(self):
        return self._battle_state
    


app = App()
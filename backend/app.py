from sqlalchemy.exc import IntegrityError # To catch DB errors like unique constraints
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


# db_url = str(os.getenv('DATABASE_URL'))
# print(f'DB URL: {db_url=}')
db_url = "postgresql://bc_user:bc_password@localhost:5432/battle_command_db"
print(f'DB URL: {db_url=}')
if not db_url:
    raise ValueError("No DATABASE_URL set for Flask application. Please set it in .env file.")

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking overhead

db = SQLAlchemy(app)

@app.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    from backend.models.User import User
    from backend.models.Interaction import Interaction
    from backend.models.Battle import Battle

    with app.app_context():
        # db.drop_all()
        print("Run create all")
        db.create_all()
    print("Initialized the database.")


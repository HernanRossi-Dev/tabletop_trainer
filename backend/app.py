from sqlalchemy.exc import IntegrityError # To catch DB errors like unique constraints
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)


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
    from backend.models.Users import Users
    from backend.models.Interactions import Interactions
    from backend.models.Battles import Battles

    with app.app_context():
        # db.drop_all()
        print("Run create all")
        db.create_all()
    print("Initialized the database.")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) # Set debug=False for production
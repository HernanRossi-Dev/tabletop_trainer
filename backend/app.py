import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import UUID, JSONB # Specific PostgreSQL types
from sqlalchemy.exc import IntegrityError # To catch DB errors like unique constraints
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# --- Database Configuration ---
# db_url = os.getenv('DATABASE_URL')
db_url = "postgresql://myuser:mysecretpassword@localhost:5432/wargainer_db"
if not db_url:
    raise ValueError("No DATABASE_URL set for Flask application. Please set it in .env file.")

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking overhead

db = SQLAlchemy(app) # Initialize SQLAlchemy extension
# -----------------------------

# --- Database Models ---

class User(db.Model):
    __tablename__ = 'users' # Explicit table name

    # Columns
    # Use primary_key=True for UUID
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True) # Allow email to be optional
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationship (optional but useful) - one-to-many: User can have many interactions
    interactions = db.relationship('Interaction', backref='user', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.username} (ID: {self.id})>'

    # Helper to convert model to dictionary for JSON response
    def to_dict(self):
        return {
            "user_id": str(self.id), # Convert UUID to string for JSON
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() # Use ISO format for dates
        }

class Interaction(db.Model):
    __tablename__ = 'interactions' # Explicit table name (often good practice)

    # Columns
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False, index=True) # Foreign key to users table
    type = db.Column(db.String(50), nullable=False) # 'initial', 'text', 'image'
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    user_input = db.Column(db.Text, nullable=True) # Store user text or filename
    llm_output = db.Column(db.Text, nullable=True) # Store LLM response
    context = db.Column(JSONB, nullable=True) # Store arbitrary JSON context (e.g., initial setup)

    def __repr__(self):
        return f'<Interaction {self.id} (User: {self.user_id}, Type: {self.type})>'

    # Helper to convert model to dictionary
    def to_dict(self):
        return {
            "interaction_id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type,
            "timestamp": self.timestamp.isoformat(),
            "user_input": self.user_input,
            "llm_output": self.llm_output,
            "context": self.context # JSONB is directly serializable
        }

# --- Helper Functions ---
# Now handled by querying the DB model
# def user_exists(user_id): ...

# --- API Endpoints ---

@app.route('/api/users/<uuid:user_id>', methods=['GET']) # Use uuid converter for route param
def get_user(user_id):
    """
    1: Get User Endpoint
    Retrieves information for a specific user from the database.
    """
    # Query using primary key lookup (efficient)
    # user = User.query.get_or_404(user_id) # Provides built-in 404 if not found
    # Alternatively, for more custom error message:
    user = db.session.get(User, user_id) # Newer syntax for primary key lookup
    if user is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict()), 200

@app.route('/api/users', methods=['POST'])
def create_user():
    """
    2: Post User Endpoint
    Creates a new user in the database.
    Expects JSON data like {'username': 'some_user', 'email': 'user@example.com'}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    username = data.get('username')
    email = data.get('email') # Optional

    if not username:
        return jsonify({"error": "Missing 'username' in request body"}), 400

    # Create User object
    new_user = User(username=username, email=email) # id and created_at have defaults

    try:
        # Add to session and commit to database
        db.session.add(new_user)
        db.session.commit()
        print(f"User created: {new_user}") # Server log
        return jsonify(new_user.to_dict()), 201 # 201 Created status code
    except IntegrityError as e:
        db.session.rollback() # Important: Rollback session on error
        print(f"Database Integrity Error: {e}")
        # Check if it's a unique constraint violation (e.g., username or email exists)
        if "unique constraint" in str(e).lower():
             return jsonify({"error": "Username or Email already exists"}), 409 # 409 Conflict
        else:
             return jsonify({"error": "Database error creating user"}), 500
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route('/api/interactions/initial', methods=['POST'])
def post_initial_interaction():
    """
    3: Post Initial Interaction Endpoint
    Logs the initial interaction setup to the database.
    Expects JSON like {'user_id': 'some_uuid', 'initial_context': {...}}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user_id_str = data.get('user_id')
    initial_context = data.get('initial_context', {})

    if not user_id_str:
        return jsonify({"error": "Missing 'user_id' in request body"}), 400

    try:
        user_id = uuid.UUID(user_id_str) # Convert string to UUID object
    except ValueError:
        return jsonify({"error": "Invalid user_id format"}), 400

    # Verify user exists in DB
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found"}), 404

    # --- Placeholder for your logic ---
    # Initialize conversation state externally if needed
    # ----------------------------------

    # Create Interaction log entry
    new_interaction = Interaction(
        user_id=user_id,
        type='initial',
        context=initial_context # Store context as JSONB
    )

    try:
        db.session.add(new_interaction)
        db.session.commit()
        print(f"Initial interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Initial interaction processed successfully",
            "interaction_id": str(new_interaction.id) # Return the new interaction ID
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error logging initial interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500


@app.route('/api/interactions/text', methods=['POST'])
def post_text_interaction():
    """
    4: Post Text Interaction Endpoint
    Handles text input, calls LLM (placeholder), logs interaction.
    Expects JSON like {'user_id': 'some_uuid', 'text': 'User message'}
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    user_id_str = data.get('user_id')
    user_text = data.get('text')

    if not user_id_str or not user_text:
        return jsonify({"error": "Missing 'user_id' or 'text' in request body"}), 400

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return jsonify({"error": "Invalid user_id format"}), 400

    # Verify user exists
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found"}), 404

    # --- Placeholder for your LLM Logic ---
    # 1. Retrieve relevant conversation history for user_id from Interaction table
    #    history = Interaction.query.filter_by(user_id=user_id).order_by(Interaction.timestamp.asc()).all()
    # 2. Send user_text and history to your LLM
    # 3. Get the LLM's response
    # ---------------------------------------
    # Example response (replace with actual LLM output)
    llm_response_text = f"LLM processed text from {user.username}: '{user_text}'."

    # Create Interaction log entry
    new_interaction = Interaction(
        user_id=user_id,
        type='text',
        user_input=user_text,
        llm_output=llm_response_text # Store actual LLM response here
    )

    try:
        db.session.add(new_interaction)
        db.session.commit()
        print(f"Text interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Text interaction processed successfully",
            "llm_response": llm_response_text,
            "interaction_id": str(new_interaction.id)
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error logging text interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500


@app.route('/api/interactions/image', methods=['POST'])
def post_image_interaction():
    """
    5: Post Image Interaction Endpoint
    Handles image input, calls processing/LLM (placeholder), logs interaction.
    Expects multipart/form-data with 'image' file and 'user_id' field.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No 'image' file part in the request"}), 400

    file = request.files['image']
    user_id_str = request.form.get('user_id') # Get user_id from form data

    if not user_id_str:
        return jsonify({"error": "Missing 'user_id' in form data"}), 400

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return jsonify({"error": "Invalid user_id format"}), 400

    # Verify user exists
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found"}), 404

    # Securely handle the filename and save the file (implement proper saving)
    # from werkzeug.utils import secure_filename
    # filename = secure_filename(file.filename)
    # upload_path = os.path.join('path_to_your_uploads', filename) # Configure this path
    # try:
    #     file.save(upload_path)
    # except Exception as e:
    #     print(f"Error saving file: {e}")
    #     return jsonify({"error": "Could not save uploaded file"}), 500
    filename = file.filename # Using original filename for simplicity here
    print(f"Received image file: {filename}") # Server log - ADD ACTUAL SAVING LOGIC

    # --- Placeholder for your Image Processing/LLM Logic ---
    # 1. Process the saved image (e.g., analysis, description generation)
    # 2. Potentially send image data/URL to a multimodal LLM
    # 3. Get a response based on the image
    # ------------------------------------------------------
    # Example response
    llm_response_text = f"LLM processed image '{filename}' from {user.username}."

    # Create Interaction log entry
    new_interaction = Interaction(
        user_id=user_id,
        type='image',
        user_input=filename, # Store filename as user input reference
        llm_output=llm_response_text # Replace with actual response
    )

    try:
        db.session.add(new_interaction)
        db.session.commit()
        print(f"Image interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Image interaction processed successfully",
            "filename": filename,
            "llm_response": llm_response_text,
            "interaction_id": str(new_interaction.id)
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error logging image interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500

# --- Database Initialization Command ---
# It's better to run this once manually or via a script/migration tool (like Alembic)
# than on every app start.
# You can run this from the Python interactive shell after importing db and app:
# >>> from app import app, db
# >>> with app.app_context():
# ...   db.create_all()
# ...
# Or create a Flask CLI command:
@app.cli.command("init-db")
def init_db_command():
    """Clear existing data and create new tables."""
    with app.app_context():
        # db.drop_all() # Optional: Use with caution, deletes all data!
        db.create_all()
    print("Initialized the database.")

# --- Main Execution ---
if __name__ == '__main__':
    # Ensure app context is available for operations like db setup if needed immediately
    # with app.app_context():
    #    db.create_all() # Creates tables if they don't exist. See init-db command above.
    app.run(debug=True, host='0.0.0.0', port=5000) # Set debug=False for production
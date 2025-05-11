from datetime import datetime, timedelta
import uuid
from psycopg2 import IntegrityError
import requests
import jwt
from flask import request, jsonify, make_response, Response, stream_with_context
from google.oauth2 import id_token
from google.auth.transport import requests as grequests
from .helpers import get_battle_armies, jwt_required, read_rules_file
from backend.models.User import User
from backend.models.Interaction import Interaction
from backend.models.Battle import Battle
import sys
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy import or_
from .parameters import JWT_SECRET, JWT_ALGORITHM
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.src.app import app, db

@app.after_request
def handle_options_and_cors(response):
    # Set CORS headers for all responses
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    if request.method == "OPTIONS":
        response.status_code = 204
        response.data = b""
    return response


@app.route('/api/authorization', methods=['POST', 'OPTIONS'])
def google_authorization():
    if request.method == 'OPTIONS':
        return '', 204
    data = request.get_json()
    code = data.get('code')
    client_id = data.get('client_id')
    redirect_uri = data.get('redirect_uri')
    if not code or not client_id or not redirect_uri:
        return jsonify({'error': 'Missing required parameters'}), 400
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        'code': code,
        'client_id': client_id,
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    token_resp = requests.post(token_url, data=token_data)
    if not token_resp.ok:
        app.logger.error(f"Token exchange failed: {token_resp.text}")
        return jsonify({'error': 'Failed to exchange code', 'details': token_resp.text}), 400

    tokens = token_resp.json()
    id_token_jwt = tokens.get('id_token')
    if not id_token_jwt:
        app.logger.error("No id_token in response")
        return jsonify({'error': 'No id_token in response'}), 400

    # Verify and decode the id_token
    try:
        idinfo = id_token.verify_oauth2_token(id_token_jwt, grequests.Request(), client_id)
        app.logger.info(f"ID Token verified: {idinfo}") # Debugging log

        email = idinfo.get('email')
        username = idinfo.get('name')
        user = User.query.filter(
            or_(
                User.email == email if email else False,
                User.username == username if username else False
            )
        ).first()
        if user is None:
            user = User(
                id=uuid.uuid4(),
                username=idinfo.get('name'),
                email=email,
                profile_picture=idinfo.get('picture'),
                created_at=datetime.now()
            )
            db.session.add(user)
            db.session.commit()
        # else:
        #     user.profile_picture = idinfo.get('picture')
        #     db.session.commit()
        payload = {
            "user_id": str(user.id),
            "email": user.email,
            "exp": datetime.now().astimezone() + timedelta(hours=12)  # Token expires in 12 hours
        }
        access_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return jsonify({
            "access_token": access_token,
            "user": user.to_dict()
        }), 200
    except ValueError as e:
        return jsonify({'error': 'Invalid id_token', 'details': str(e)}), 401


@app.route('/api/users/<uuid:email>', methods=['GET']) # Get user by email
@jwt_required
def get_user(email):
    user = User.query.filter_by(email=email).first()
    if user is None:
        return jsonify({"error": "Users not found"}), 404
    return jsonify(user.to_dict()), 200


@app.route('/api/users', methods=['PUT'])
@jwt_required
def update_user():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "User not found"}), 404

    # Update fields if present in the request
    if 'name' in data:
        user.username = data['name']
    if 'email' in data:
        user.email = data['email']
    if 'profile_picture' in data:
        user.profile_picture = data['profile_picture']
    # Add more fields as needed

    try:
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update user", "details": str(e)}), 500


@app.route('/api/battles', methods=['GET'])
@jwt_required
def fetch_battles(_context=None):
    app.logger.info(f"--- FETCH BATTLE ENDPOINT CALLED ---") # Debugging log
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400
    try:
        app.logger.info(f'Fetching battles for user: {user_id}') # Debugging log
        battles = Battle.query.all()
        battles_list = [battle.to_dict() for battle in battles]
        users_battle = [b for b in battles_list if b['user_id'] == user_id]
        import json
        app.logger.info(json.dumps(users_battle)) 
        return jsonify(users_battle), 200
    except Exception as e:
        app.logger.info(f"Error fetching battles: {e}")
        return jsonify({"error": "Failed to fetch battles"}), 500


@app.route('/api/battles', methods=['POST'])
@jwt_required
def create_battle(_context=None):
    """
    2: Post Create Battles Endpoint
    Creates a new Battles entity in the database.
    Expects JSON data like {'playArea': {'width': 44, 'height': 60}, 'playerArmy': 'Black Templars', 'opponentArmy': 'Tau'}
    """
    app.logger.info(f"--- CREATE BATTLE ENDPOINT CALLED ---") # Debugging log
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    app.logger.info(f"Create battle endpoint called {data=}")
    playArea = data.get('playArea')
    width = playArea.get('width')
    height = playArea.get('height')
    user_id = data.get('userId')
    player_army = data.get('playerArmy')
    opponent_army = data.get('opponentArmy')
    battle_name = data.get('battleName')

    if not data:
        return jsonify({"error": "Missing data in request body"}), 400

    new_battle = Battle(user_id=user_id,
                        id=uuid.uuid4(),
                        battle_name=battle_name,
                        width=width,
                        height=height,
                        player_army=player_army,
                        opponent_army=opponent_army,
                        battle_round="0",
                        army_turn="0",
                        player_score="0",
                        opponent_score="0",
                        timestamp=datetime.now(),
                        battle_log = {'index': 0},
                        archived=False
                      )
    try:
        db.session.add(new_battle)
        db.session.commit()
        app.logger.info(f"Battle created: {new_battle}") # Server log
        return jsonify(new_battle.to_dict()), 201 # 201 Created status code
    except IntegrityError as e:
        db.session.rollback() # Important: Rollback session on error
        app.logger.info(f"Database Integrity Error: {e}")
        # Check if it's a unique constraint violation (e.g., username or email exists)
        if "unique constraint" in str(e).lower():
             return jsonify({"error": "Username or Email already exists"}), 409 # 409 Conflict
        else:
             return jsonify({"error": "Database error creating user"}), 500
    except Exception as e:
        db.session.rollback()
        app.logger.info(f"Error creating user: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500


@app.route('/api/interactions/text/stream', methods=['POST'])
@jwt_required
def post_text_interaction_stream(_context=None):
    """
    4: Post Text Interaction Endpoint
    Handles text input, calls LLM (Gemini), logs interaction.
    Expects JSON like {'user_id': 'some_uuid', 'text': 'Users message'}
    """
    app.logger.info(f"--- POST TEXT INTERACTION STREAM ENDPOINT CALLED --- {request.get_json()}") # Debugging log
    data = request.get_json()
    user_id_str = data.get('user_id')
    battle_id_str = data.get('battle_id')
    user_text = data.get('text')

    if not user_id_str or not user_text:
        app.logger.info(f"--- not populated") # Debugging log
        return jsonify({"error": "Missing 'user_id' or 'text' in request body"}), 400

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        return jsonify({"error": "Invalid user_id format"}), 400
    app.logger.info(f"--- user_id: {user_id} ---") # Debugging log
    # Verify user exists
    user = db.session.get(User, user_id)
    if user is None:
        return jsonify({"error": "Users not found"}), 404

    # --- LangChain Gemini LLM Logic ---
    try:
        battle_armies = get_battle_armies(battle_id_str)
        app.logger.info(f"--- battle_armies: {battle_armies} ---") # Debugging log
        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.0-flash",
            google_api_key=os.environ["GOOGLEAI_API_KEY"]
        )
        system_instructions =  """*****Your Instructions********
You are an AI Oppenent for a Player who wants to play a practive game of Warhammer 40K. YOu are an expert of the latest rules for all factions and detachments of 40K. You will speak to your oppenent as an experienced commander in the 40K universe. 
"""
        system_instructions += f"Your Opponent is playing {battle_armies['player_army']} and you are playing {battle_armies['opponent_army']}.\n"
        
        full_rules = read_rules_file()
        system_instructions += f"Here are the rules for the game: {full_rules}\n"
        messages = [
            ("system", system_instructions),
            ("human", user_text),
        ]
        app.logger.info(f"--- LLM Messages: {messages} ---") # Debugging log
        llm_response = llm.invoke(messages)
        llm_response_text = getattr(llm_response, "content", str(llm_response))
        app.logger.info(f"--- LLM Response: {llm_response_text} ---") # Debugging log
    except Exception as e:
        app.logger.info(f"Error calling Gemini API: {e}")
        return jsonify({"error": "Failed to call Gemini API", "details": str(e)}), 500

    # Create Interaction log entry
    new_interaction = Interaction(
        user_id=user_id,
        type='text',
        user_input=user_text,
        llm_output=llm_response_text
    )

    try:
        db.session.add(new_interaction)
        db.session.commit()
        app.logger.info(f"Text interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Text interaction processed successfully",
            "llm_response": llm_response_text,
            "interaction_id": str(new_interaction.id)
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.info(f"Error logging text interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500


@app.route('/api/interactions/text', methods=['POST'])
@jwt_required
def post_text_interaction():
    """
    4: Post Text Interaction Endpoint
    Handles text input, calls LLM (placeholder), logs interaction.
    Expects JSON like {'user_id': 'some_uuid', 'text': 'Users message'}
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
        return jsonify({"error": "Users not found"}), 404

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
        app.logger.info(f"Text interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Text interaction processed successfully",
            "llm_response": llm_response_text,
            "interaction_id": str(new_interaction.id)
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.info(f"Error logging text interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500


@app.route('/api/interactions/image', methods=['POST'])
@jwt_required
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
        return jsonify({"error": "Users not found"}), 404

    # Securely handle the filename and save the file (implement proper saving)
    # from werkzeug.utils import secure_filename
    # filename = secure_filename(file.filename)
    # upload_path = os.path.join('path_to_your_uploads', filename) # Configure this path
    # try:
    #     file.save(upload_path)
    # except Exception as e:
    #     app.logger.info(f"Error saving file: {e}")
    #     return jsonify({"error": "Could not save uploaded file"}), 500
    filename = file.filename # Using original filename for simplicity here
    app.logger.info(f"Received image file: {filename}") # Server log - ADD ACTUAL SAVING LOGIC

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
        app.logger.info(f"Image interaction for user {user_id} logged.") # Server log
        return jsonify({
            "message": "Image interaction processed successfully",
            "filename": filename,
            "llm_response": llm_response_text,
            "interaction_id": str(new_interaction.id)
        }), 200
    except Exception as e:
        db.session.rollback()
        app.logger.info(f"Error logging image interaction: {e}")
        return jsonify({"error": "An unexpected error occurred logging interaction"}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) # Set debug=False for production
# --- Database Credentials ---
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=bc_password # CHANGE THIS!
export POSTGRES_DB=your_database
export POSTGRES_PORT=5432
export POSTGRES_HOST=localhost
# --- Flask App Configuration ---
export DATABASE_URL=postgresql://bc_user:yourpassword@localhost:5432/your_database

# Flask specific
export FLASK_APP=app.py
export FLASK_DEBUG=1
export FLASK_RUN_HOST=0.0.0.0
export GOOGLE_CLIENT_ID=your_google_id
export GOOGLE_CLIENT_SECRET=your_google_secret
export JWT_SECRET=your_jwt_secret
export GOOGLEAI_API_KEY=your_google_secret

# bash run_flask.sh
uv run celery -A backend.tasks.celery_worker.celery worker --loglevel=info
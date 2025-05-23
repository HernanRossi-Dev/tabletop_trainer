Install:
curl -LsSf https://astral.sh/uv/install.sh | sh

uv venv
uv pip install -r pyproject.toml

source .venv/bin/activate

Run From root of directory:

chmod 777 backend/run_celery.sh
chmod 777 backend/run_flask.sh

./backend/run_celery.sh
./backend/run_flask.sh
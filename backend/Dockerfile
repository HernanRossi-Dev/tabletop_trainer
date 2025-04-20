# backend/Dockerfile
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install poetry
RUN pip install poetry

# Configure Poetry
RUN poetry config virtualenvs.create false

# Copy dependency definitions
COPY pyproject.toml poetry.lock* /app/

# Install backend dependencies (including gunicorn)
# Add gunicorn to your pyproject.toml: poetry add gunicorn
RUN poetry install --no-interaction --no-ansi --no-root

# Copy the backend application code
COPY . /app/

# No EXPOSE needed here if only accessed internally by Nginx
# EXPOSE 5000

# Command to run the backend server using Gunicorn
# Adjust workers as needed. Bind to 0.0.0.0 and the internal port.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
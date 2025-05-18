import os


JWT_SECRET = os.environ.get("JWT_SECRET")  # Set this in your env!
GOOGLEAI_API_KEY = os.environ.get("GOOGLEAI_API_KEY")  # Set this in your env!
JWT_ALGORITHM = "HS256"
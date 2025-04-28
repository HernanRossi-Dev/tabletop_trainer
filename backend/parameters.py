import os


JWT_SECRET = os.environ.get("JWT_SECRET")  # Set this in your env!
JWT_ALGORITHM = "HS256"
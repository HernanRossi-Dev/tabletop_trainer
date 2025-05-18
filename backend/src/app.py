import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .gen_client import GenClient



class App:

    _flask: Flask
    _db: SQLAlchemy
    _gen_client: GenClient

    
    def setup_flask(self):
        flask = Flask(__name__)
        CORS(flask, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
        file_handler = logging.FileHandler('app.log')
        file_handler.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        flask.logger.addHandler(file_handler)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        flask.logger.addHandler(console_handler)

        return flask

    @property
    def flask(self):
        if not self._flask:
            self._flask = self.setup_flask()
        return self._flask
    
    @property
    def db(self):
        if not self._db:
            db_url = os.getenv('DATABASE_URL')
            if not db_url:
                raise ValueError("No DATABASE_URL set for Flask application. Please set it in .env file.")
            self.flask.config['SQLALCHEMY_DATABASE_URI'] = db_url
            self.flask.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False # Disable modification tracking overhead
            self._db = SQLAlchemy(self.flask)
        return self._db
    
    @property
    def log(self):
        return self.flask.logger
    
    @property
    def gen_client(self):
        if not self._gen_client:
            self._gen_client = GenClient()
        return self._gen_client
    


app = App()
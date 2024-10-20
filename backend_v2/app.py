from flask import Flask
from flask_cors import CORS
from socket_app import create_app
from routes import bp  # Import the blueprint
from sms import sms_bp  # Import the SMS blueprint
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

app, socketio = create_app()
CORS(app)

# Register blueprints
app.register_blueprint(bp)
app.register_blueprint(sms_bp)

if __name__ == '__main__':
    socketio.run(app, debug=True)

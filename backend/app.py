from flask import send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from socket_app import create_app
from routes import bp  # Import the blueprint
from sms import sms_bp  # Import the SMS blueprint

app, socketio = create_app()
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///friends.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Register blueprints
app.register_blueprint(bp)
app.register_blueprint(sms_bp)

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    socketio.run(app, debug=True)

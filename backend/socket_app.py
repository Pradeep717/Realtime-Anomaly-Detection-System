from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# socket io on connect
@socketio.on('connect')
def handle_connect():
    print('Client connected')

# socket io on disconnect
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


def create_app():
    return app, socketio

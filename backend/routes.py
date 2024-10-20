from flask import Blueprint, jsonify
from flask_socketio import emit
import cv2
import numpy as np
import torch
import torch.nn as nn
import yaml
import time
import base64
from socket_app import socketio

bp = Blueprint('routes', __name__)

# Load configuration
with open('config/config.yaml', 'r') as f:
    config = yaml.safe_load(f)

model_path = config['training']['anomaly_model_path']
anomaly_threshold = config['data']['anomaly_threshold']
test_video_path = config['data']['test_video_path']
input_dim = config['training']['input_dim']

# Define the VAE model
class VAE(nn.Module):
    def __init__(self, input_dim):
        super(VAE, self).__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(),
            nn.Linear(512, 128),
            nn.ReLU()
        )
        self.mu_layer = nn.Linear(128, 128)
        self.logvar_layer = nn.Linear(128, 128)
        self.decoder = nn.Sequential(
            nn.Linear(128, 512),
            nn.ReLU(),
            nn.Linear(512, input_dim),
            nn.Sigmoid()
        )

    def forward(self, x):
        encoded = self.encoder(x)
        mu = self.mu_layer(encoded)
        logvar = self.logvar_layer(encoded)
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = eps.mul(std).add_(mu)
        decoded = self.decoder(z)
        return decoded, mu, logvar

# Load the trained model
model = VAE(input_dim)
model.load_state_dict(torch.load(model_path))
model.eval()

#default route
@bp.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the Anomaly Detection API"}), 200

@bp.route('/start-video', methods=['GET'])
def start_video():
    socketio.start_background_task(process_video)
    return jsonify({"message": "Video processing started"}), 200

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

def process_video():
    cap = cv2.VideoCapture(test_video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    frame_sequence = []
    anomaly_scores = []
    frame_number = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (224, 224), interpolation=cv2.INTER_AREA)
        gray = 0.2989 * frame[:, :, 0] + 0.5870 * frame[:, :, 1] + 0.1140 * frame[:, :, 2]
        gray = (gray - gray.mean()) / gray.std()
        gray = np.clip(gray, 0, 1)

        gray_flattened = gray.flatten()
        frame_sequence.append(gray_flattened)

        if len(frame_sequence) * gray_flattened.size >= input_dim:
            input_data = np.concatenate(frame_sequence, axis=0)[:input_dim]
            frame_sequence.pop(0)

            if input_data.shape[0] != input_dim:
                continue

            with torch.no_grad():
                input_tensor = torch.tensor(input_data, dtype=torch.float32).view(-1, input_dim)
                output_tensor, _, _ = model(input_tensor)
                loss = np.mean(np.abs(output_tensor.numpy() - input_tensor.numpy()))
                anomaly_scores.append(loss)

                # Determine the label based on the anomaly score
                label = 'Abnormal' if loss > anomaly_threshold else 'Normal'
                print(f'{label} Event Detected', loss)

                # Convert frame to base64
                _, buffer = cv2.imencode('.jpg', frame)
                frame_base64 = base64.b64encode(buffer).decode('utf-8')

                # Emit the frame and its data
                socketio.emit('frame_data', {
                    'frame': frame_base64,
                    'frame_number': frame_number,
                    'anomaly_score': float(loss),
                    'label': label
                })

            frame_number += 1
            time.sleep(0.1)  # Adjust based on your frame rate

    cap.release()

# # 'start_video' event handler
# @socketio.on('start_video')
# def handle_start_video():
#     print("Starting video processing")
#     socketio.start_background_task(process_video)

# # 'stop_video' event handler
# @socketio.on('stop_video')
# def handle_stop_video():
#     return "Video processing stopped"

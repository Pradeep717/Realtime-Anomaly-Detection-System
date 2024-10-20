from flask import Blueprint, jsonify, request
from flask_socketio import emit
import cv2
import numpy as np
import tensorflow as tf
import imutils
import yaml
import time
import base64
import cloudinary
import cloudinary.uploader
import pymongo
from datetime import datetime
from socket_app import socketio
from dotenv import load_dotenv
import os

load_dotenv()

bp = Blueprint('routes', __name__)

# Load configuration
with open('config/config.yaml', 'r') as f:
    config = yaml.safe_load(f)

model_path = config['training']['anomaly_model_path']
anomaly_threshold = config['data']['anomaly_threshold']
test_video_path = config['data']['test_video_path']
input_dim = config['training']['input_dim']

# Load the threshold from the YAML file
with open('campus_small_sliding15.yaml', 'r') as file:
    config = yaml.safe_load(file)
threshold = config['psnr_threshold']

# Ensure TensorFlow uses the GPU
physical_devices = tf.config.list_physical_devices('GPU')
if len(physical_devices) > 0:
    try:
        tf.config.experimental.set_memory_growth(physical_devices[0], True)
    except RuntimeError as e:
        print(e)

def mean_squared_loss(x1, x2):
    difference = x1 - x2
    sq_difference = difference ** 2
    mse = np.mean(sq_difference)
    return mse

def psnr(mse):
    return 10 * np.log10(1 / mse)

# Load the pre-trained model
model = tf.keras.models.load_model(model_path)

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# MongoDB configuration
client = pymongo.MongoClient(os.getenv('MONGO_URI'))
db = client.get_database()
collection = db['abnormal_clips']

# Flag to control video processing
processing = False
last_saved_time = 0

@bp.route('/', methods=['GET'])
def index():
    return jsonify({"message": "Welcome to the Anomaly Detection API"}), 200

@bp.route('/start-video', methods=['GET'])
def start_video():
    global processing
    processing = True
    socketio.start_background_task(process_video)
    return jsonify({"message": "Video processing started"}), 200

@bp.route('/stop-video', methods=['GET'])
def stop_video():
    global processing
    processing = False
    return jsonify({"message": "Video processing stopped"}), 200

@bp.route('/get-abnormal-clips', methods=['GET'])
def get_abnormal_clips():
    clips = list(collection.find({}, {'_id': 0}))
    return jsonify(clips), 200

@bp.route('/get-clips-by-date', methods=['POST'])
def get_clips_by_date():
    data = request.get_json()
    start_date = datetime.strptime(data['start_date'], '%Y-%m-%d %H:%M:%S')
    end_date = datetime.strptime(data['end_date'], '%Y-%m-%d %H:%M:%S')
    clips = list(collection.find({'timestamp': {'$gte': start_date, '$lte': end_date}}, {'_id': 0}))
    return jsonify(clips), 200

@bp.route('/update-confirmed-status', methods=['POST'])
def update_confirmed_status():
    data = request.get_json()
    video_url = data['video_url']
    confirmed_status = data['confirmed']
    result = collection.update_one({'video_url': video_url}, {'$set': {'confirmed': confirmed_status}})
    if result.matched_count > 0:
        return jsonify({"message": "Update successful"}), 200
    else:
        return jsonify({"message": "Video not found"}), 404

@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

def save_clip(frames, start_time):
    # Create a video writer
    height, width, layers = frames[0].shape
    size = (width, height)
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    filename = f'abnormal_clip_{int(time.time())}.avi'
    out = cv2.VideoWriter(filename, fourcc, 20.0, size)

    for frame in frames:
        out.write(frame)
    out.release()

    # Upload to Cloudinary
    response = cloudinary.uploader.upload(filename, resource_type="video", folder="abnormal_clips")
    video_url = response['url']

    # Save metadata to MongoDB
    collection.insert_one({
        'video_url': video_url,
        'timestamp': datetime.now(),
        'start_time': start_time,
        'end_time': datetime.now(),
        'confirmed': True  # Default to true
    })

    # Remove the local file
    os.remove(filename)

def process_video():
    global processing, last_saved_time
    cap = cv2.VideoCapture(test_video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    window_size = 5
    frame_buffer = []
    abnormal_frames = []
    frame_number = 0
    abnormal_count = 0
    normal_count = 0
    max_clip_duration = 2 * 60  # 2 minutes in seconds

    while cap.isOpened() and processing:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (227, 227), interpolation=cv2.INTER_AREA)
        gray = 0.2989 * frame[:, :, 0] + 0.5870 * frame[:, :, 1] + 0.1140 * frame[:, :, 2]
        gray = (gray - gray.mean()) / gray.std()
        gray = np.clip(gray, 0, 1)
        frame_buffer.append(gray)

        if len(frame_buffer) < window_size:
            continue

        imagedump = np.array(frame_buffer)
        imagedump.resize(227, 227, window_size)
        imagedump = np.expand_dims(imagedump, axis=0)
        imagedump = np.expand_dims(imagedump, axis=4)

        imagedump_tensor = tf.convert_to_tensor(imagedump)
        output = model.predict(imagedump_tensor)

        mse = mean_squared_loss(imagedump, output)
        psnr_score = psnr(mse)
        label = 'Abnormal' if psnr_score < threshold else 'Normal'

        # Convert frame to base64
        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')

        # Emit the frame and its data
        socketio.emit('frame_data', {
            'frame': frame_base64,
            'frame_number': frame_number,
            'anomaly_score': float(psnr_score),
            'label': label
        })

        if label == 'Abnormal':
            abnormal_count += 1
            normal_count = 0
            abnormal_frames.append(frame)
        else:
            normal_count += 1
            if abnormal_count >= 5 and normal_count >= 100:
                if len(abnormal_frames) > 0:
                    save_clip(abnormal_frames, datetime.now())
                    abnormal_frames = []
                    last_saved_time = time.time()
                abnormal_count = 0

        if abnormal_count >= 5 and (time.time() - last_saved_time) >= 5 * 60:
            if len(abnormal_frames) > 0:
                save_clip(abnormal_frames, datetime.now())
                abnormal_frames = []
                last_saved_time = time.time()
            abnormal_count = 0

        if len(abnormal_frames) > 0 and (time.time() - last_saved_time) >= max_clip_duration:
            save_clip(abnormal_frames, datetime.now())
            abnormal_frames = []
            last_saved_time = time.time()

        frame_buffer.pop(0)
        frame_number += 1
        time.sleep(0.1)  # Adjust based on your frame rate

    cap.release()

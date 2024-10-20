import cv2
import numpy as np
from keras.models import load_model
import tensorflow as tf
import imutils
import matplotlib.pyplot as plt
import yaml

# Load the threshold from the YAML file
with open('campus_small_sliding15.yaml', 'r') as file:
    config = yaml.safe_load(file)
threshold = config['psnr_threshold']
print(f"Loaded threshold: {threshold}")
# threshold=2

# Ensure TensorFlow uses the GPU
physical_devices = tf.config.list_physical_devices('GPU')
if len(physical_devices) > 0:
    try:
        tf.config.experimental.set_memory_growth(physical_devices[0], True)
        print(f"Using GPU: {physical_devices[0]}")
    except RuntimeError as e:
        print(e)
else:
    print("No GPU found. Using CPU.")

def mean_squared_loss(x1, x2):
    difference = x1 - x2
    sq_difference = difference ** 2
    mse = np.mean(sq_difference)
    return mse

def psnr(mse):
    return 10 * np.log10(1 / mse)

# Load the pre-trained model
model = load_model('./saved_model/campus_small_sliding15.h5')

# RTSP URL for the CCTV camera
# rtsp_url = 'rtsp://eie:eie12345@10.50.226.60:554/cam/realmonitor?channel=1&subtype=0'


# Open the video file
video_path = './test_data/0040.avi'
# video_path = './test_data/custom_videos/test.avi'
cap = cv2.VideoCapture(video_path)

# Get the total number of frames in the video
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
print(f"Total frames in video: {total_frames}")

# Initialize lists for plotting
anomaly_scores = []
frame_numbers = []
frame_count = 0
processed_frame_count = 0

# Define threshold for PSNR
# threshold = 8.9
window_size = 5
frame_buffer = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Exit loop if no frame is returned

    processed_frame_count += 1
    image = imutils.resize(frame, width=1000, height=1200)

    frame = cv2.resize(frame, (227, 227), interpolation=cv2.INTER_AREA)
    gray = 0.2989 * frame[:, :, 0] + 0.5870 * frame[:, :, 1] + 0.1140 * frame[:, :, 2]
    gray = (gray - gray.mean()) / gray.std()
    gray = np.clip(gray, 0, 1)
    frame_buffer.append(gray)

    if len(frame_buffer) < window_size:
        continue  # Wait until we have enough frames to fill the window

    # Process the frames in the buffer
    imagedump = np.array(frame_buffer)
    imagedump.resize(227, 227, window_size)
    imagedump = np.expand_dims(imagedump, axis=0)
    imagedump = np.expand_dims(imagedump, axis=4)

    # Ensure the input tensor is on the correct device
    imagedump_tensor = tf.convert_to_tensor(imagedump)

    output = model.predict(imagedump_tensor)

    # Calculate MSE and PSNR
    mse = mean_squared_loss(imagedump, output)
    psnr_score = psnr(mse)
    anomaly_scores.append(psnr_score)
    frame_numbers.append(processed_frame_count)

    if psnr_score < threshold:
        print('Abnormal Event Detected')
        print(f"PSNR: {psnr_score}")
        cv2.putText(image, "Abnormal Event", (220, 100), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
    else:
        print('Normal')
        print(f"PSNR: {psnr_score}")
        cv2.putText(image, "Normal Event", (220, 100), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 4)

    cv2.imshow("video", image)
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

    # Remove the oldest frame from the buffer to slide the window
    frame_buffer.pop(0)

cap.release()
cv2.destroyAllWindows()

# Plotting the anomaly scores
plt.figure(figsize=(10, 6))
plt.plot(frame_numbers, anomaly_scores, label='PSNR Score')
plt.axhline(y=threshold, color='r', linestyle='--', label='Threshold')
plt.ylabel('PSNR Score')
plt.xlabel('Frame Number')
plt.title('Anomaly Scores in Video Frames')
plt.legend()
plt.show()

print(f"Total frames processed for prediction: {processed_frame_count}")
print(f"Total number of anomaly scores: {len(anomaly_scores)}")

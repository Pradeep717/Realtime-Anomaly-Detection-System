from flask import Blueprint, jsonify
import requests

sms_bp = Blueprint('sms', __name__)

@sms_bp.route('/send-notification', methods=['GET'])
def send_notification():
    try:
        response = requests.get('https://send.lk/sms/send.php', params={
            'token': '1509|Y8kFWOl1AD0TBAZjZH3C5YJ1r9roIabTAHmFrPWn',
            'to': '0769836337',
            'from': 'DWT Edu msg',
            'message': 'Abnormal event detected, please take your attention'
        })
        if response.ok:
            return jsonify({'message': 'Notification sent'}), 200
        else:
            return jsonify({'error': 'Failed to send notification'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

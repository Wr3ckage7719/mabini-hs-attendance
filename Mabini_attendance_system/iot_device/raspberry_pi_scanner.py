#!/usr/bin/env python3
"""
IoT Device Script for Raspberry Pi
Mabini HS Smart Attendance System
Captures RFID/Barcode ID and face photo, sends to server for verification
"""

import time
import requests
import base64
import json
from datetime import datetime
import RPi.GPIO as GPIO
from picamera import PiCamera
from mfrc522 import SimpleMFRC522  # For RFID
# Alternative: import barcode scanner library

# Configuration
API_BASE_URL = "http://your-server-url.com/api"
API_KEY = "mabini_device_001_key_2025"
DEVICE_ID = "DEVICE001"

# GPIO Setup
BUZZER_PIN = 18
GREEN_LED = 23
RED_LED = 24

GPIO.setmode(GPIO.BCM)
GPIO.setup(BUZZER_PIN, GPIO.OUT)
GPIO.setup(GREEN_LED, GPIO.OUT)
GPIO.setup(RED_LED, GPIO.OUT)

# Initialize camera
camera = PiCamera()
camera.resolution = (640, 480)

# Initialize RFID reader
reader = SimpleMFRC522()

def beep(duration=0.1):
    """Sound buzzer"""
    GPIO.output(BUZZER_PIN, GPIO.HIGH)
    time.sleep(duration)
    GPIO.output(BUZZER_PIN, GPIO.LOW)

def set_led(color, state):
    """Control LEDs"""
    pin = GREEN_LED if color == 'green' else RED_LED
    GPIO.output(pin, GPIO.HIGH if state else GPIO.LOW)

def capture_photo():
    """Capture photo from camera"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = f"/tmp/face_{timestamp}.jpg"
        camera.capture(filepath)
        
        # Convert to base64
        with open(filepath, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        return encoded_string
    except Exception as e:
        print(f"Error capturing photo: {e}")
        return None

def read_rfid():
    """Read RFID card"""
    try:
        print("Waiting for RFID card...")
        id, text = reader.read()
        return str(id)
    except Exception as e:
        print(f"Error reading RFID: {e}")
        return None

def send_heartbeat():
    """Send heartbeat to server"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        }
        
        payload = {
            'status': 'online',
            'ip_address': get_local_ip()
        }
        
        response = requests.post(
            f"{API_BASE_URL}/heartbeat.php",
            headers=headers,
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            print("Heartbeat sent successfully")
        else:
            print(f"Heartbeat failed: {response.status_code}")
            
    except Exception as e:
        print(f"Error sending heartbeat: {e}")

def verify_entry(student_id, face_image):
    """Send verification request to server with SMS notification"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        }
        
        payload = {
            'student_id': student_id,
            'face_image': face_image
        }
        
        response = requests.post(
            f"{API_BASE_URL}/verify-entry.php",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        result = response.json()
        
        # Display SMS status if sent
        if result.get('sms_sent'):
            print("📱 SMS notification sent to guardian")
        elif result.get('success'):
            print("⚠️  SMS notification could not be sent")
        
        return result
        
    except Exception as e:
        print(f"Error verifying entry: {e}")
        return None

def handle_verification_response(response):
    """Handle server response with SMS notification feedback"""
    if not response:
        print("No response from server")
        beep(0.5)
        set_led('red', True)
        time.sleep(2)
        set_led('red', False)
        return
    
    if response.get('gate_action') == 'granted':
        student_name = response.get('student', {}).get('name', 'Unknown')
        action = response.get('action', 'entry')
        
        # Display action type
        if action == 'check_out':
            print(f"✅ CHECK-OUT: {student_name}")
            print(f"   Time: {response.get('timestamp', '')}")
        else:
            print(f"✅ CHECK-IN: {student_name}")
            print(f"   Time: {response.get('timestamp', '')}")
        
        # Success feedback
        set_led('green', True)
        beep(0.1)
        time.sleep(0.1)
        beep(0.1)
        time.sleep(2)
        set_led('green', False)
        
    else:
        print(f"❌ ACCESS DENIED: {response.get('message', 'Unknown error')}")
        
        # Denied feedback
        set_led('red', True)
        beep(0.5)
        time.sleep(2)
        set_led('red', False)

def get_local_ip():
    """Get local IP address"""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "unknown"

def main():
    """Main loop"""
    print(f"IoT Device {DEVICE_ID} starting...")
    print(f"API URL: {API_BASE_URL}")
    
    # Send initial heartbeat
    send_heartbeat()
    
    # Heartbeat timer
    last_heartbeat = time.time()
    heartbeat_interval = 60  # seconds
    
    try:
        while True:
            # Send periodic heartbeat
            if time.time() - last_heartbeat > heartbeat_interval:
                send_heartbeat()
                last_heartbeat = time.time()
            
            print("\n" + "="*50)
            print("Ready to scan. Present ID card...")
            
            # Read RFID card
            student_id = read_rfid()
            
            if student_id:
                print(f"ID Scanned: {student_id}")
                beep(0.1)
                
                # Capture face photo
                print("Capturing face photo...")
                time.sleep(0.5)  # Brief delay for positioning
                face_image = capture_photo()
                
                if face_image:
                    print("Photo captured, verifying...")
                else:
                    print("Warning: No face photo captured, verifying with ID only...")
                
                # Send verification request
                response = verify_entry(student_id, face_image)
                
                # Handle response
                handle_verification_response(response)
                
            time.sleep(1)  # Brief delay before next scan
            
    except KeyboardInterrupt:
        print("\nShutting down...")
    finally:
        GPIO.cleanup()
        camera.close()

if __name__ == "__main__":
    main()

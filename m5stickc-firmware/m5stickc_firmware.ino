// M5StickC Plus 2 - Wearable AI Companion Firmware
// Features:
// - IMU gesture detection (wave, flick, tilt, shake)
// - Microphone audio streaming
// - WiFi WebSocket communication
// - Motion-based interaction

#include <M5StickCPlus2.h>
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "gesture_detector.h"

// Configuration
#define SSID "YOUR_WIFI_SSID"
#define PASSWORD "YOUR_WIFI_PASSWORD"
#define SERVER_IP "YOUR_SERVER_IP"
#define SERVER_PORT 8765

// Global objects
WebSocketsClient webSocket;
M5Canvas canvas(&M5.Lcd);
GestureDetector gestureDetector;

// IMU sensor data
float accelX = 0, accelY = 0, accelZ = 0;
float gyroX = 0, gyroY = 0, gyroZ = 0;

// Audio buffer for microphone
const int AUDIO_BUFFER_SIZE = 512;
uint8_t audioBuffer[AUDIO_BUFFER_SIZE];
int audioIndex = 0;

// Status variables
bool isConnected = false;
unsigned long lastSensorRead = 0;
unsigned long lastAudioCapture = 0;
const unsigned long SENSOR_INTERVAL = 10; // 100Hz reading
const unsigned long AUDIO_INTERVAL = 20;  // 50Hz audio capture

// WebSocket event handler
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
    switch(type) {
        case WStype_CONNECTED:
            isConnected = true;
            M5.Lcd.setTextColor(GREEN);
            M5.Lcd.println("Connected!");
            break;
            
        case WStype_TEXT: {
            DynamicJsonDocument doc(256);
            deserializeJson(doc, payload);
            
            const char* command = doc["command"];
            if(strcmp(command, "led") == 0) {
                int brightness = doc["value"];
                M5.Axp.SetLcdVoltage(brightness);
            }
            break;
        }
            
        case WStype_DISCONNECTED:
            isConnected = false;
            M5.Lcd.setTextColor(RED);
            M5.Lcd.println("Disconnected");
            break;
    }
}

// Read IMU sensors
void readIMU() {
    if(M5.IMU.getAccelAdc(&accelX, &accelY, &accelZ)) {
        // Scale to m/s^2
        accelX *= 0.000976; // 9.8 / 10000
        accelY *= 0.000976;
        accelZ *= 0.000976;
    }
    
    if(M5.IMU.getGyroAdc(&gyroX, &gyroY, &gyroZ)) {
        // Scale to deg/s
        gyroX *= 0.0305; // 360 / (65536 * 1.818)
        gyroY *= 0.0305;
        gyroZ *= 0.0305;
    }
}

// Detect gestures from IMU data
void detectGesturesAndSend() {
    Gesture gesture = gestureDetector.detect(accelX, accelY, accelZ, gyroX, gyroY, gyroZ);
    
    if(gesture.type != GESTURE_NONE) {
        if(isConnected) {
            // Create JSON payload
            DynamicJsonDocument doc(512);
            doc["type"] = "gesture";
            doc["gesture"] = gestureToString(gesture.type);
            doc["intensity"] = gesture.intensity;
            doc["timestamp"] = millis();
            
            // Serialize and send
            String jsonStr;
            serializeJson(doc, jsonStr);
            webSocket.sendTXT(jsonStr);
            
            // Display on screen
            M5.Lcd.setTextColor(YELLOW);
            M5.Lcd.printf("Gesture: %s (%.2f)\n", gestureToString(gesture.type), gesture.intensity);
        }
    }
}

// Capture and stream audio
void captureAudio() {
    // Read from microphone input
    // Note: M5StickC Plus 2 uses I2S for audio
    // This is a placeholder - implement with proper I2S driver
    
    if(isConnected && audioIndex >= AUDIO_BUFFER_SIZE) {
        DynamicJsonDocument doc(1024);
        doc["type"] = "audio";
        doc["data"] = base64::encode(audioBuffer, AUDIO_BUFFER_SIZE);
        doc["timestamp"] = millis();
        
        String jsonStr;
        serializeJson(doc, jsonStr);
        webSocket.sendTXT(jsonStr);
        
        audioIndex = 0;
    }
}

// Convert gesture enum to string
const char* gestureToString(GestureType type) {
    switch(type) {
        case GESTURE_WAVE: return "wave";
        case GESTURE_FLICK: return "flick";
        case GESTURE_SHAKE: return "shake";
        case GESTURE_TILT_LEFT: return "tilt_left";
        case GESTURE_TILT_RIGHT: return "tilt_right";
        case GESTURE_ROTATE_CW: return "rotate_cw";
        case GESTURE_ROTATE_CCW: return "rotate_ccw";
        default: return "none";
    }
}

// WiFi connection
void connectToWiFi() {
    M5.Lcd.println("Connecting to WiFi...");
    WiFi.begin(SSID, PASSWORD);
    
    int attempts = 0;
    while(WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        M5.Lcd.print(".");
        attempts++;
    }
    
    if(WiFi.status() == WL_CONNECTED) {
        M5.Lcd.setTextColor(GREEN);
        M5.Lcd.println("\nWiFi Connected!");
        M5.Lcd.printf("IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
        M5.Lcd.setTextColor(RED);
        M5.Lcd.println("\nWiFi Failed");
    }
}

// Button press handlers
void handleButtonA() {
    if(isConnected) {
        webSocket.sendTXT("{\"type\": \"button\", \"button\": \"A\"}");
    }
}

void handleButtonB() {
    if(isConnected) {
        webSocket.sendTXT("{\"type\": \"button\", \"button\": \"B\"}");
    }
}

void setup() {
    // Initialize M5StickC Plus 2
    auto cfg = M5.config();
    M5.begin(cfg);
    
    // Initialize display
    M5.Lcd.setTextSize(1);
    M5.Lcd.setTextColor(WHITE);
    M5.Lcd.println("M5StickC Plus 2");
    M5.Lcd.println("AI Companion");
    
    // Initialize IMU
    if(!M5.IMU.begin()) {
        M5.Lcd.setTextColor(RED);
        M5.Lcd.println("IMU Init Failed");
    }
    
    // Initialize gesture detector
    gestureDetector.init();
    
    // Connect to WiFi
    connectToWiFi();
    
    // Initialize WebSocket
    webSocket.begin(SERVER_IP, SERVER_PORT, "/");
    webSocket.onEvent(webSocketEvent);
    
    // Set up button handlers
    M5.BtnA.setClickHandler(handleButtonA);
    M5.BtnB.setClickHandler(handleButtonB);
}

void loop() {
    M5.update();
    webSocket.loop();
    
    // Read sensors at 100Hz
    unsigned long now = millis();
    if(now - lastSensorRead >= SENSOR_INTERVAL) {
        readIMU();
        detectGesturesAndSend();
        lastSensorRead = now;
    }
    
    // Capture audio at 50Hz
    if(now - lastAudioCapture >= AUDIO_INTERVAL) {
        captureAudio();
        lastAudioCapture = now;
    }
    
    delay(5);
}

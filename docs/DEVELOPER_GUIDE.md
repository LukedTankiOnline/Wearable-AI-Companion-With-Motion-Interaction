# Developer Guide - Wearable AI Companion

## Architecture Overview

The system consists of three main components:

### 1. M5StickC Plus 2 (Hardware Layer)
- Runs Arduino firmware
- Reads IMU at 100Hz
- Captures audio from microphone
- Connects via WiFi
- Sends data via WebSocket

### 2. Python Backend (Processing Layer)
- FastAPI server
- WebSocket server for real-time communication
- AI model integration
- Voice recognition/synthesis
- Gesture processing

### 3. Web Frontend (Presentation Layer)
- Three.js 3D avatar rendering
- WebSocket client
- Real-time animation system
- Responsive UI

## System Communication

```
M5StickC Plus 2 (WiFi)
        │
        ├─→ IMU Data (gesture)
        │   └─→ WebSocket: {type: "gesture", gesture: "wave", intensity: 0.8}
        │
        └─→ Microphone Data (voice)
            └─→ WebSocket: {type: "audio", data: "base64_chunk"}

                    Backend Server (Processing)
                    │
                    ├─→ Gesture Recognition
                    │   └─→ AI Response Generation
                    │       └─→ Animation Selection
                    │
                    └─→ Speech Recognition
                        └─→ LLM Inference
                            └─→ Text-to-Speech

                            Web Client (Browser)
                            │
                            ├─→ Avatar Animation Playback
                            ├─→ Emotion Expression Update
                            └─→ Audio Output
```

## Code Organization

### Frontend JavaScript Classes

#### `AvatarController`
Manages 3D avatar rendering and animation.

**Key Methods:**
- `setEmotion(emotion)`: Updates avatar expression
- `playAnimation(name)`: Triggers animation sequence
- `animate()`: Main render loop (60 FPS)

**Key Properties:**
- `currentEmotion`: Active emotion state
- `currentAnimation`: Playing animation
- `avatar`: Three.js Group containing avatar geometry

#### `AICompanionApp`
Main application controller managing interaction flow.

**Key Methods:**
- `connect()`: Establishes WebSocket connection
- `handleMessage(data)`: Processes server responses
- `simulateGesture(type)`: Sends gesture to backend
- `setEmotion(emotion)`: Updates UI and avatar

**Key Properties:**
- `ws`: WebSocket connection
- `avatar`: AvatarController instance
- `gestureHistory`: Array of recent gestures

### Backend Python Classes

#### `AIBackend`
Handles AI model inference and voice processing.

**Key Methods:**
- `transcribe_audio(bytes)`: Converts audio to text
- `generate_response(text, context)`: Gets AI response
- `generate_speech(text)`: Converts text to audio

#### `ConnectionManager`
Manages WebSocket client connections.

**Key Methods:**
- `connect(id, websocket)`: Register new connection
- `disconnect(id)`: Remove connection
- `broadcast(data)`: Send to all clients

#### `GestureDetector` (C++)
Recognizes hand gestures from IMU data.

**Key Methods:**
- `detect(ax, ay, az, gx, gy, gz)`: Analyze motion data
- `detectWave()`: Detect wave gesture
- `detectShake()`: Detect shake gesture
- `detectRotation()`: Detect rotation gesture

## Adding New Gestures

### Step 1: Add Gesture Type (M5 Firmware)

Edit `m5stickc-firmware/gesture_detector.h`:

```cpp
enum GestureType {
    // ... existing gestures
    GESTURE_CUSTOM = 8  // Add new type
};
```

### Step 2: Implement Detection Logic

```cpp
bool detectCustom(Gesture &gesture) {
    // Analyze accelerometer/gyroscope data
    // Return true if custom gesture detected
    
    gesture.type = GESTURE_CUSTOM;
    gesture.intensity = calculateIntensity();
    lastGestureTime = millis();
    return true;
}
```

### Step 3: Call Detection in Main Loop

In `GestureDetector::detect()`:
```cpp
if(detectCustom(gesture)) return gesture;
```

### Step 4: Map to Intent (Backend)

Edit `backend/main.py`:
```python
GESTURE_INTENTS = {
    # ... existing gestures
    "custom": {
        "intent": "custom_action",
        "animation": "custom_animation",
        "emotion": "happy"
    }
}
```

### Step 5: Add Animation (Frontend)

Edit `frontend/js/avatar.js`:
```javascript
this.actions.custom_animation = {
    animate: () => {
        // Update avatar geometry
        this.head.rotation.x = Math.sin(time) * angle;
    }
};
```

## Adding New Animations

### 1. Define Animation Logic

In `avatar.js`:
```javascript
this.actions.new_animation = {
    animate: (() => {
        let startTime = Date.now();
        return () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if(elapsed > duration) startTime = Date.now();
            
            // Update avatar properties
            this.head.rotation.y = Math.sin(elapsed * speed) * amplitude;
        };
    })()
};
```

### 2. Map Gesture to Animation

In gesture intents:
```python
"custom_gesture": {
    "animation": "new_animation",
    ...
}
```

### 3. Trigger from Event

```javascript
this.avatar.playAnimation('new_animation');
```

## Customizing AI Responses

### 1. Modify System Prompt

In `backend/main.py`, `AIBackend.generate_response()`:

```python
system_prompt = """Your custom personality and behavior instructions here."""
```

### 2. Add Context to Requests

```python
# Include gesture/emotion in prompt
if gesture:
    system_prompt += f"\nUser just made a {gesture} gesture."
```

### 3. Process Response

```python
response = model.generate(system_prompt, user_input)
emotion = self._detect_emotion(response)
animation = self._select_animation(response)
```

## Performance Optimization

### Frontend

**Reduce Draw Calls:**
```javascript
// Merge geometries where possible
const geometry = THREE.BufferGeometryUtils.mergeGeometries([...]);
```

**Simplify Avatar:**
- Reduce polygon count
- Lower shadow resolution
- Disable fog if not needed

### Backend

**Async Processing:**
```python
async def process_gesture(data):
    # Non-blocking gesture handling
    pass
```

**Batch Operations:**
```python
# Process multiple audio chunks together
audio_batch = []
if len(audio_batch) >= threshold:
    transcribe_batch(audio_batch)
```

### M5 Device

**Reduce Data Rate:**
```cpp
const unsigned long SENSOR_INTERVAL = 20;  // 50Hz instead of 100Hz
```

**Gesture Filtering:**
```cpp
const uint32_t GESTURE_COOLDOWN = 1000;  // Increase cooldown
```

## Testing

### Unit Tests (Backend)

```bash
cd backend/
pytest tests/
```

### Integration Tests

```python
# Mock M5 WebSocket client
async def test_gesture_flow():
    async with websockets.connect('ws://localhost:8765') as ws:
        await ws.send(json.dumps({
            "type": "gesture",
            "gesture": "wave"
        }))
        response = await ws.recv()
        assert response["type"] == "response"
```

### Manual Testing

1. **Gesture Testing**: 
   - Open browser console
   - Call `app.simulateGesture('wave')`

2. **Voice Testing**:
   - Record test audio
   - Send via WebSocket

3. **Avatar Testing**:
   - Call `app.avatar.playAnimation('wave')`
   - Verify animation plays

## Debugging

### Browser Console

```javascript
// Enable verbose logging
console.log = (...args) => console.log(...args);

// Monitor WebSocket traffic
const originalSend = window.app.ws.send;
window.app.ws.send = function(data) {
    console.log("WS Send:", JSON.parse(data));
    originalSend.call(this, data);
};
```

### Backend Logs

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py

# Tail logs in real-time
tail -f app.log | grep -E "(ERROR|WARNING|DEBUG)"
```

### M5 Serial Monitor

```
Arduino IDE → Tools → Serial Monitor
Watch IMU output and gesture detection
```

## Deployment

### Local Network

1. Set `SERVER_IP` in M5 firmware to laptop IP
2. Start backend: `python main.py`
3. Access from phone on same network

### Docker Deployment

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["python", "main.py"]
```

```bash
docker build -t wearable-ai .
docker run -p 8765:8765 wearable-ai
```

### Cloud Deployment

For production deployment to cloud (AWS, Google Cloud, Azure):

1. Use HTTPS/WSS with SSL certificates
2. Implement authentication (API keys, OAuth)
3. Use environment variables for configuration
4. Set up proper logging and monitoring
5. Implement rate limiting

## Common Issues & Solutions

### WebSocket Connection Drops

**Cause**: Network timeout or server crash

**Solution**:
```javascript
// Implement reconnection logic
const reconnect = () => {
    setTimeout(() => this.connect(), 2000);
};

this.ws.onclose = () => reconnect();
```

### Audio Latency Too High

**Cause**: Large buffer size or slow network

**Solution**:
```cpp
// Reduce buffer size
const int AUDIO_BUFFER_SIZE = 256;  // Was 512
const unsigned long AUDIO_INTERVAL = 10;  // Was 20ms
```

### Avatar Jittering

**Cause**: Animation frame rate inconsistency

**Solution**:
```javascript
// Use fixed time step
const deltaTime = 1/60;  // Fixed 60 FPS
const time = frameCount * deltaTime;
```

## Resources

- **Three.js**: https://threejs.org/docs/
- **FastAPI**: https://fastapi.tiangolo.com/
- **WebSockets**: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **M5StickC Plus 2**: https://docs.m5stack.com/en/core/m5stickc_plus2
- **Arduino**: https://www.arduino.cc/reference/

---

Happy developing! 🚀

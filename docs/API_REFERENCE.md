# WebSocket API Reference

## Connection

### Endpoint
```
ws://localhost:8765/ws/{client_id}
wss://your-server.com/ws/{client_id}  # Production with SSL
```

### Example (JavaScript)
```javascript
const clientId = `web_${Math.random().toString(36).substr(2, 9)}`;
const ws = new WebSocket(`ws://localhost:8765/ws/${clientId}`);

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
ws.onerror = (error) => console.error('Error:', error);
ws.onclose = () => console.log('Disconnected');
```

## Message Types

### 1. Handshake (Client → Server)

**Purpose**: Identify client on connection

```json
{
  "type": "handshake",
  "clientId": "web_abc123def",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-11-29T10:30:00Z"
}
```

**Response**: None (connection established)

---

### 2. Gesture Detection (M5 → Server)

**Purpose**: Send detected gesture from M5StickC

```json
{
  "type": "gesture",
  "gesture": "wave",
  "intensity": 0.85,
  "timestamp": 1701253800000
}
```

**Fields**:
- `gesture` (string): One of: `wave`, `flick`, `shake`, `tilt_left`, `tilt_right`, `rotate_cw`, `rotate_ccw`
- `intensity` (float): 0.0 to 1.0 - strength of the gesture
- `timestamp` (integer): Unix timestamp in milliseconds

**Server Response**: 
```json
{
  "type": "response",
  "gesture": "wave",
  "text": "Hi Luke! Great to see you!",
  "animation": "wave",
  "emotion": "happy",
  "timestamp": "2024-11-29T10:30:00Z"
}
```

---

### 3. Audio Stream (M5 → Server)

**Purpose**: Send microphone audio data

```json
{
  "type": "audio",
  "data": "//NExAAR...(base64_encoded_audio_chunk)...==",
  "timestamp": 1701253800000
}
```

**Fields**:
- `data` (string): Base64-encoded audio chunk
- `timestamp` (integer): Unix timestamp in milliseconds

**Requirements**:
- Audio format: PCM 16-bit, 16kHz sample rate
- Chunk size: 4096 bytes recommended
- Send continuously for streaming audio

**Server Response** (when buffer full):
```json
{
  "type": "voice_response",
  "transcribed": "What's the weather today?",
  "response": "It's sunny and warm today!",
  "emotion": "happy",
  "animation": "nod",
  "audio": "//NExAAR...(base64_encoded_audio_response)...==",
  "timestamp": "2024-11-29T10:30:00Z"
}
```

---

### 4. Button Press (M5 → Server)

**Purpose**: Send physical button press

```json
{
  "type": "button",
  "button": "A"
}
```

**Fields**:
- `button` (string): `A` or `B`

**Server Response**:
```json
{
  "type": "button_response",
  "button": "A",
  "response": "Button A pressed!",
  "animation": "wave",
  "emotion": "happy"
}
```

---

### 5. Animation Command (Server → Client)

**Purpose**: Trigger specific animation on client

```json
{
  "type": "animation",
  "animation": "wave",
  "duration": 1500
}
```

**Fields**:
- `animation` (string): Animation name
- `duration` (integer, optional): Duration in milliseconds

**Supported Animations**:
- `idle` - Default idle state
- `wave` - Friendly wave
- `nod` - Nodding gesture
- `shake_head` - Disagreement
- `point` - Pointing
- `spin_right` / `spin_left` - Spinning
- `look_left` / `look_right` - Looking
- `listen` - Listening pose

---

### 6. Emotion Update (Server → Client)

**Purpose**: Change avatar emotion

```json
{
  "type": "emotion",
  "emotion": "happy",
  "duration": 2000
}
```

**Fields**:
- `emotion` (string): Emotion name
- `duration` (integer, optional): How long to show emotion

**Supported Emotions**:
- `happy` - Smiling, bright
- `sad` - Frowning, gray
- `angry` - Squinting, red
- `confused` - Uncertain, yellow
- `neutral` - Default, normal
- `listening` - Focused, blue
- `excited` - Eyes wide, bright blue

---

### 7. Text Display (Server → Client)

**Purpose**: Show text on web client

```json
{
  "type": "text",
  "text": "Hello! How are you today?",
  "duration": 5000,
  "style": "info"
}
```

**Fields**:
- `text` (string): Text to display
- `duration` (integer, optional): Display duration in ms
- `style` (string, optional): `info`, `warning`, `error`

---

### 8. Status Update (Server → Client)

**Purpose**: Broadcast status to all clients

```json
{
  "type": "status",
  "status": "listening",
  "details": {
    "connected_devices": 2,
    "active_gestures": 1,
    "uptime": 3600
  }
}
```

---

## Error Responses

### Connection Errors

```json
{
  "type": "error",
  "code": "CONNECTION_FAILED",
  "message": "WiFi connection lost",
  "timestamp": "2024-11-29T10:30:00Z"
}
```

### Server Errors

```json
{
  "type": "error",
  "code": "SERVER_ERROR",
  "message": "Failed to process gesture",
  "timestamp": "2024-11-29T10:30:00Z"
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| `CONNECTION_FAILED` | WiFi/Network issue |
| `SERVER_ERROR` | Backend processing error |
| `INVALID_MESSAGE` | Malformed JSON |
| `AI_ERROR` | AI model error |
| `AUDIO_ERROR` | Audio processing failed |
| `TIMEOUT` | Request timed out |

---

## Rate Limiting

The backend implements basic rate limiting:

```
Gesture: Max 10 per second per client
Audio: Max 100 chunks per second
Text: Max 20 messages per second
```

Exceeding limits will result in:
```json
{
  "type": "error",
  "code": "RATE_LIMITED",
  "message": "Too many requests",
  "retryAfter": 1000
}
```

---

## Best Practices

### 1. Connection Management

```javascript
// Implement reconnection with exponential backoff
let reconnectAttempts = 0;
const MAX_ATTEMPTS = 5;

function connect() {
    ws = new WebSocket(url);
    ws.onclose = () => {
        if(reconnectAttempts < MAX_ATTEMPTS) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            setTimeout(connect, delay);
            reconnectAttempts++;
        }
    };
}
```

### 2. Message Queuing

```javascript
const messageQueue = [];
let isConnected = false;

function send(message) {
    if(isConnected && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        messageQueue.push(message);
    }
}

ws.onopen = () => {
    isConnected = true;
    while(messageQueue.length > 0) {
        ws.send(JSON.stringify(messageQueue.shift()));
    }
};
```

### 3. Audio Streaming

```javascript
// Send audio in chunks with proper pacing
const CHUNK_SIZE = 4096;
const SAMPLE_RATE = 16000;
let audioBuffer = new Uint8Array(CHUNK_SIZE);

function streamAudio(audioData) {
    for(let i = 0; i < audioData.length; i += CHUNK_SIZE) {
        const chunk = audioData.slice(i, i + CHUNK_SIZE);
        const base64 = btoa(String.fromCharCode(...chunk));
        
        send({
            type: 'audio',
            data: base64,
            timestamp: Date.now()
        });
        
        // Don't overwhelm network - space out chunks
        await new Promise(r => setTimeout(r, CHUNK_SIZE / SAMPLE_RATE * 1000));
    }
}
```

### 4. Error Handling

```javascript
ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    // Implement error recovery
    updateUIStatus('error');
    attemptReconnect();
};

// Listen for server errors
function handleMessage(message) {
    if(message.type === 'error') {
        console.error(`Server error [${message.code}]: ${message.message}`);
        // Handle specific error codes
        switch(message.code) {
            case 'RATE_LIMITED':
                // Back off and retry
                break;
            case 'AI_ERROR':
                // Show user-friendly message
                break;
        }
    }
}
```

---

## Examples

### Complete Gesture Flow

```javascript
// 1. Connect
const ws = new WebSocket('ws://localhost:8765/ws/client_123');

// 2. Send gesture
ws.send(JSON.stringify({
    type: 'gesture',
    gesture: 'wave',
    intensity: 0.9,
    timestamp: Date.now()
}));

// 3. Receive response
ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    if(response.type === 'response') {
        console.log(response.text);  // "Hi there!"
        avatar.playAnimation(response.animation);
        avatar.setEmotion(response.emotion);
    }
};
```

### Complete Voice Flow

```javascript
// 1. Stream audio from microphone
async function captureAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = (event) => {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            
            // Send to server
            ws.send(JSON.stringify({
                type: 'audio',
                data: base64,
                timestamp: Date.now()
            }));
        };
        reader.readAsDataURL(event.data);
    };
    
    recorder.start();
}

// 2. Receive transcription and response
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if(message.type === 'voice_response') {
        console.log('You said:', message.transcribed);
        console.log('AI said:', message.response);
        
        // Play audio response
        playAudio(message.audio);
        
        // Animate
        avatar.playAnimation(message.animation);
    }
};
```

---

## Troubleshooting

### "Connection Refused"
- Verify backend is running on correct host/port
- Check firewall settings
- Verify WiFi connectivity

### "Unexpected Message Type"
- Validate JSON format
- Check all required fields are present
- Review protocol version

### "Audio Not Transcribed"
- Verify audio format (16-bit PCM, 16kHz)
- Check audio quality
- Ensure sufficient audio duration (>500ms)

### "High Latency"
- Check network bandwidth
- Reduce gesture detection frequency
- Optimize audio chunk size
- Consider local AI instead of cloud

---

For more information, see the main README and DEVELOPER_GUIDE.

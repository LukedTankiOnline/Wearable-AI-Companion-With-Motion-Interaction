# Testing and Utilities Guide

## Testing Tools

### 1. Backend Health Check

```bash
# Test if backend is running
curl http://localhost:8765/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-11-29T10:30:00.123456",
  "services": {
    "speech_recognition": true,
    "openai": true,
    "text_to_speech": true
  }
}
```

### 2. WebSocket Test Client

Create `test_websocket.py`:

```python
import asyncio
import json
import websockets
from datetime import datetime

async def test_connection():
    uri = "ws://localhost:8765/ws/test_client_123"
    
    async with websockets.connect(uri) as websocket:
        print("[✓] Connected to server")
        
        # Test 1: Send handshake
        print("\n[→] Sending handshake...")
        await websocket.send(json.dumps({
            "type": "handshake",
            "clientId": "test_client_123",
            "userAgent": "Test Client v1.0",
            "timestamp": datetime.now().isoformat()
        }))
        
        # Test 2: Send gesture
        print("[→] Sending gesture (wave)...")
        await websocket.send(json.dumps({
            "type": "gesture",
            "gesture": "wave",
            "intensity": 0.85,
            "timestamp": int(datetime.now().timestamp() * 1000)
        }))
        
        # Receive and display response
        print("\n[← Receiving responses...]")
        try:
            while True:
                response = await asyncio.wait_for(websocket.recv(), timeout=10)
                data = json.loads(response)
                print(json.dumps(data, indent=2))
                
                if data.get('type') == 'response':
                    print(f"✓ Got response: {data.get('text')}")
                    break
        except asyncio.TimeoutError:
            print("✗ Timeout waiting for response")
        except Exception as e:
            print(f"✗ Error: {e}")

# Run the test
if __name__ == "__main__":
    asyncio.run(test_connection())
```

Run it:
```bash
python test_websocket.py
```

### 3. Gesture Simulation

JavaScript console commands:

```javascript
// Test wave gesture
app.simulateGesture('wave');

// Test multiple gestures
const gestures = ['wave', 'flick', 'shake', 'tilt_left', 'tilt_right', 'rotate_cw', 'rotate_ccw'];
gestures.forEach((g, i) => setTimeout(() => app.simulateGesture(g), i * 2000));

// Test with custom intensity
app.send({
    type: 'gesture',
    gesture: 'wave',
    intensity: 0.3,
    timestamp: Date.now()
});
```

### 4. Avatar Animation Testing

```javascript
// Test all animations
const animations = ['wave', 'nod', 'point', 'shake_head', 'spin_right', 'look_left', 'look_right'];
animations.forEach((anim, i) => {
    setTimeout(() => {
        app.avatar.playAnimation(anim);
        console.log(`Playing: ${anim}`);
    }, i * 2000);
});

// Test emotion changes
const emotions = ['happy', 'sad', 'angry', 'confused', 'neutral', 'listening'];
emotions.forEach((emotion, i) => {
    setTimeout(() => {
        app.setEmotion(emotion);
        console.log(`Emotion: ${emotion}`);
    }, i * 1000);
});
```

### 5. Performance Monitoring

```javascript
// Monitor WebSocket latency
window.latencies = [];

const originalSend = window.app.ws.send;
window.app.ws.send = function(data) {
    const sendTime = performance.now();
    originalSend.call(this, data);
};

// Measure response time
const originalOnmessage = window.app.ws.onmessage;
window.app.ws.onmessage = function(event) {
    const receiveTime = performance.now();
    originalOnmessage.call(this, event);
};

// Get stats
function getLatencyStats() {
    const avg = window.latencies.reduce((a, b) => a + b, 0) / window.latencies.length;
    const max = Math.max(...window.latencies);
    const min = Math.min(...window.latencies);
    console.log(`Latency - Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(2)}ms`);
}
```

### 6. Memory Profiling

```javascript
// Monitor memory usage (Chrome/Edge)
function getMemoryStats() {
    if(performance.memory) {
        const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
        const limit = (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2);
        console.log(`Memory: ${used}MB / ${limit}MB`);
    }
}

// Monitor periodically
setInterval(getMemoryStats, 5000);
```

## Debugging Tips

### M5 Serial Output

Connect to M5 via USB and open Serial Monitor:

```
Arduino IDE → Tools → Serial Monitor → 115200 baud
```

Expected output:
```
M5StickC Plus 2
AI Companion
Connecting to WiFi...
..
WiFi Connected!
IP: 192.168.1.100
Connected!
```

### Browser DevTools

#### Network Tab
- Monitor WebSocket messages
- Check message frequency and size
- Identify bottlenecks

#### Console Tab
```javascript
// Enable verbose logging
window.DEBUG = true;

// Override methods to log
const originalLog = console.log;
console.log = function(...args) {
    originalLog('[APP]', ...args);
};
```

#### Performance Tab
- Record runtime performance
- Identify frame rate issues
- Find animation bottlenecks

### Backend Logs

```bash
# Start with debug logging
DEBUG=1 python backend/main.py

# Or configure in code:
import logging
logging.basicConfig(level=logging.DEBUG)
```

Expected log output:
```
INFO: Application startup complete
INFO: Client web_abc123 connected
INFO: Received gesture from web_abc123: wave
INFO: Generated response: Hi Luke! Great to see you!
INFO: Client web_abc123 disconnected
```

## Unit Tests

### Backend Tests

Create `backend/tests/test_gestures.py`:

```python
import pytest
from backend.main import ai_backend

@pytest.mark.asyncio
async def test_response_generation():
    """Test AI response generation"""
    text, anim_data = await ai_backend.generate_response(
        "Hello",
        {}
    )
    assert text is not None
    assert anim_data['emotion'] in ['happy', 'neutral', 'confused']

@pytest.mark.asyncio  
async def test_transcription():
    """Test audio transcription"""
    # Create mock audio data (16-bit PCM, 16kHz)
    import struct
    audio_data = struct.pack('<h', 0) * 16000  # 1 second of silence
    
    result = await ai_backend.transcribe_audio(audio_data)
    # Result might be empty or "silence" depending on implementation
    assert result is not None
```

Run tests:
```bash
cd backend/
pytest tests/ -v
```

## Integration Tests

### Test Gesture → Response → Animation Flow

```javascript
// Test complete gesture flow
async function testGestureFlow() {
    console.log("🧪 Testing gesture flow...");
    
    // Send gesture
    app.send({
        type: 'gesture',
        gesture: 'wave',
        intensity: 0.8,
        timestamp: Date.now()
    });
    
    // Wait for response
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            console.error("✗ No response received");
            resolve(false);
        }, 5000);
        
        const originalBroadcast = fetch; // Mock check
        document.addEventListener('gesture-response', (e) => {
            clearTimeout(timeout);
            console.log("✓ Gesture flow complete");
            console.log("- Gesture:", e.detail.gesture);
            console.log("- Response:", e.detail.text);
            console.log("- Animation:", e.detail.animation);
            resolve(true);
        });
    });
}

// Run test
await testGestureFlow();
```

## Load Testing

### Simple Load Test

```python
import asyncio
import websockets
import json
import time

async def client_task(client_id, num_messages):
    """Simulate a connected client"""
    try:
        async with websockets.connect(f"ws://localhost:8765/ws/client_{client_id}") as ws:
            for i in range(num_messages):
                await ws.send(json.dumps({
                    "type": "gesture",
                    "gesture": "wave",
                    "intensity": 0.8,
                    "timestamp": int(time.time() * 1000)
                }))
                
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=5)
                except asyncio.TimeoutError:
                    print(f"Client {client_id}: Timeout on message {i+1}")
                
                await asyncio.sleep(0.5)  # Delay between gestures
        
        print(f"Client {client_id}: ✓ Completed")
    except Exception as e:
        print(f"Client {client_id}: ✗ Error - {e}")

async def run_load_test(num_clients=10, messages_per_client=5):
    """Run load test with multiple clients"""
    print(f"\n🧪 Running load test: {num_clients} clients, {messages_per_client} messages each")
    
    start_time = time.time()
    
    tasks = [
        client_task(i, messages_per_client)
        for i in range(num_clients)
    ]
    
    await asyncio.gather(*tasks)
    
    elapsed = time.time() - start_time
    total_messages = num_clients * messages_per_client
    
    print(f"\n📊 Test Results:")
    print(f"  Total messages: {total_messages}")
    print(f"  Time elapsed: {elapsed:.2f}s")
    print(f"  Messages/sec: {total_messages / elapsed:.2f}")

# Run: asyncio.run(run_load_test(num_clients=5, messages_per_client=20))
```

## Stress Testing

### Test with many gestures

```javascript
// Rapid gesture test
async function stressTest(duration = 30000) {
    const gestures = ['wave', 'flick', 'shake', 'tilt_left', 'rotate_cw'];
    const startTime = Date.now();
    let count = 0;
    
    while(Date.now() - startTime < duration) {
        const gesture = gestures[Math.floor(Math.random() * gestures.length)];
        app.simulateGesture(gesture);
        count++;
        await new Promise(r => setTimeout(r, 100));
    }
    
    console.log(`✓ Sent ${count} gestures in ${duration}ms`);
}

// Run: await stressTest(30000);
```

## Monitoring Dashboard

Create `monitor.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Companion Monitor</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>System Monitor</h1>
    <div>
        <canvas id="latencyChart"></canvas>
        <canvas id="memoryChart"></canvas>
    </div>
    
    <script>
        // Real-time latency monitoring
        const latencyCtx = document.getElementById('latencyChart').getContext('2d');
        const latencyChart = new Chart(latencyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'WebSocket Latency (ms)',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        });
        
        // Update chart periodically
        setInterval(() => {
            // Add latency data
            // latencyChart.data.labels.push(new Date().toLocaleTimeString());
            // latencyChart.data.datasets[0].data.push(latency);
            // latencyChart.update();
        }, 1000);
    </script>
</body>
</html>
```

## CI/CD Testing

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ -v
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `curl http://localhost:8765/health` | Check backend health |
| `python test_websocket.py` | Test WebSocket connection |
| `pytest backend/tests/ -v` | Run unit tests |
| `asyncio.run(run_load_test())` | Run load test |
| `app.simulateGesture('wave')` | Test gesture from console |
| `tail -f backend/app.log` | Monitor backend logs |
| `Serial Monitor (115200)` | Monitor M5 output |

Happy testing! 🧪

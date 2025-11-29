# Configuration Guide for Wearable AI Companion

## WiFi Configuration (M5StickC Plus 2)

Edit `m5stickc-firmware/m5stickc_firmware.ino`:

```cpp
#define SSID "YOUR_WIFI_SSID"
#define PASSWORD "YOUR_WIFI_PASSWORD"
#define SERVER_IP "192.168.1.100"  // Your laptop IP
#define SERVER_PORT 8765
```

## Backend Environment Variables

Create `.env` file in the `backend/` directory:

```
OPENAI_API_KEY=sk-your-key-here
GROQ_API_KEY=your-groq-key-here
USE_LOCAL_AI=false
SERVER_HOST=0.0.0.0
SERVER_PORT=8765
```

## Hardware Setup

### M5StickC Plus 2
- **Microphone**: Built-in (I2S input)
- **IMU**: Built-in 6-DOF (accelerometer + gyroscope)
- **WiFi**: Built-in
- **Display**: 240x135 TFT LCD

### Required Libraries (Arduino IDE)
```
- M5StickCPlus2
- ArduinoJson
- WebSocketsClient
```

## Backend Setup

```bash
cd backend/
pip install -r requirements.txt
```

## Frontend Setup

The frontend is served automatically when you run the backend.

Navigate to `http://localhost:8765` or `http://<your-ip>:8765` in your web browser.

## AI Model Options

### Option 1: Cloud AI (OpenAI)
- Sign up at https://openai.com/api/
- Get API key from https://platform.openai.com/account/api-keys
- Set `OPENAI_API_KEY` in environment

### Option 2: Cloud AI (Groq - Faster & Cheaper)
- Sign up at https://console.groq.com
- Get API key
- Set `GROQ_API_KEY` in environment

### Option 3: Local AI (Ollama + Llama 2)
```bash
# Install Ollama from https://ollama.ai
# Pull a model
ollama pull llama2

# Run as background service
ollama serve
```

## Voice Setup

### Google Cloud Speech-to-Text
1. Set up Google Cloud project
2. Enable Speech-to-Text API
3. Download credentials JSON
4. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

### OpenAI Whisper
Automatically used if `OPENAI_API_KEY` is set

## Running the System

### 1. Start Backend Server
```bash
cd backend/
python main.py
```

### 2. Configure and Upload M5 Firmware
- Open `m5stickc-firmware/m5stickc_firmware.ino` in Arduino IDE
- Install M5StickCPlus2 board support
- Configure WiFi credentials
- Upload to M5StickC Plus 2

### 3. Access Web Interface
- On laptop: Navigate to `http://localhost:8765`
- On phone: Navigate to `http://<laptop-ip>:8765`

## Troubleshooting

### WiFi Connection Issues
- Check SSID and password
- Ensure M5 is in WiFi range
- Check firewall settings on laptop

### WebSocket Connection Issues
- Verify `SERVER_IP` in firmware matches laptop IP
- Check that port 8765 is not blocked by firewall
- Look for error messages in browser console

### Audio Issues
- Check microphone permissions
- Verify audio input device in system settings
- Test microphone independently

### Performance Issues
- Reduce gesture detection frequency if needed
- Lower audio buffer size for lower latency
- Optimize Three.js renderer settings

## Network Diagram

```
M5StickC Plus 2 (WiFi)
    |
    └─> WiFi Network <─┐
                        │
                    Laptop (Backend + Frontend)
                        ↑
                    Android Phone (Frontend)
```

## Android Deployment

1. Put laptop on same WiFi
2. Find laptop IP: `ipconfig` (Windows) or `ifconfig` (Linux)
3. On Android, navigate to `http://<laptop-ip>:8765`
4. Add to home screen for quick access

## Performance Optimization

### Gesture Detection
- Adjust `SENSOR_INTERVAL` in firmware (currently 10ms for 100Hz)
- Adjust thresholds in `gesture_detector.h`

### Audio Streaming
- Adjust `AUDIO_INTERVAL` (currently 20ms for 50Hz)
- Modify audio buffer size in backend

### 3D Avatar
- Disable shadows for better performance
- Reduce polygon count if needed
- Use lower-resolution textures

## Security Notes

⚠️ **This is a development setup. For production:**
- Use HTTPS/WSS with proper certificates
- Implement authentication/authorization
- Sanitize all user inputs
- Use environment variables for sensitive data
- Never commit API keys to version control

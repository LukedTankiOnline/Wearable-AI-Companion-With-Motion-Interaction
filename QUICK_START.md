# 🎯 Quick Reference Card

## File Organization

```
Wearable-AI-Companion/
├── m5stickc-firmware/
│   ├── m5stickc_firmware.ino      ← Upload this to M5
│   └── gesture_detector.h
│
├── backend/
│   ├── main.py                    ← Run: python main.py
│   └── requirements.txt            ← pip install -r requirements.txt
│
├── frontend/
│   ├── index.html                 ← Open in browser
│   └── js/
│       ├── avatar.js
│       └── app.js
│
├── config/
│   ├── SETUP.md                   ← Configuration guide
│   └── .env.example               ← Copy to backend/.env
│
├── docs/
│   ├── DEVELOPER_GUIDE.md         ← For advanced customization
│   ├── API_REFERENCE.md           ← WebSocket protocol
│   └── TESTING_GUIDE.md           ← Testing utilities
│
├── start.sh                        ← Quick start script
├── README.md                       ← Main documentation
└── PROJECT_SUMMARY.md             ← This project overview
```

---

## 🚀 5-Minute Quick Start

### 1. Install & Run Backend
```bash
cd backend/
pip install -r requirements.txt
python main.py
```

### 2. Open Web Interface
```
http://localhost:8765
```

### 3. Upload M5 Firmware
- Arduino IDE → m5stickc_firmware.ino
- Edit WiFi/IP settings
- Upload

### 4. Wave Your Hand
- Avatar responds!

### 5. Try Voice
- Speak into M5
- Avatar talks back!

---

## 📱 Gestures Available

| Gesture | Motion | Result |
|---------|--------|--------|
| 👋 Wave | Swing side-to-side | Avatar waves back |
| 🤝 Shake | Vibrate up-down | Avatar shakes head |
| ⚡ Flick | Quick jab | Avatar points |
| ⬅️ Tilt | Lean left | Avatar looks left |
| ➡️ Tilt | Lean right | Avatar looks right |
| 🔄 Rotate | Spin wrist | Avatar spins |

---

## 🎨 Avatar Animations

Available animations (auto-triggered):
- `idle` - Default swaying
- `wave` - Friendly wave
- `nod` - Agreement
- `shake_head` - Disagreement
- `point` - Indicating
- `spin_right` - Spinning
- `look_left/right` - Looking

---

## 😊 Emotions

Avatar expresses:
- 😊 **Happy** - Large eyes, bright colors
- 😢 **Sad** - Smaller eyes, gray
- 😠 **Angry** - Squinting, red
- 🤔 **Confused** - Uncertain, yellow
- 😐 **Neutral** - Normal
- 👂 **Listening** - Focused, blue

---

## 🔧 Configuration

### WiFi (Firmware)
```cpp
#define SSID "YOUR_NETWORK"
#define PASSWORD "YOUR_PASSWORD"
#define SERVER_IP "192.168.1.100"
```

### API Keys (Backend)
```
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...
```

### AI Model Selection
```
USE_LOCAL_AI=false     # Cloud AI
USE_LOCAL_AI=true      # Local Ollama
```

---

## 🌐 WebSocket Messages

### Send Gesture
```json
{
  "type": "gesture",
  "gesture": "wave",
  "intensity": 0.85
}
```

### Send Audio
```json
{
  "type": "audio",
  "data": "base64_encoded_audio"
}
```

### Receive Response
```json
{
  "type": "response",
  "text": "Hi Luke!",
  "animation": "wave",
  "emotion": "happy"
}
```

---

## 🧪 Testing Commands

### Browser Console
```javascript
// Test gesture
app.simulateGesture('wave');

// Test animation
app.avatar.playAnimation('spin_right');

// Test emotion
app.setEmotion('happy');

// Display text
app.displayText('Hello World!');
```

### Terminal
```bash
# Health check
curl http://localhost:8765/health

# WebSocket test
python test_websocket.py
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| Won't connect | Check WiFi SSID/password |
| Avatar frozen | Refresh browser |
| No response | Verify backend running |
| Voice not work | Check API key set |
| High latency | Move closer to WiFi |

→ See `config/SETUP.md` for detailed help

---

## 📊 Performance Tips

| For Better | Do This |
|-----------|---------|
| Speed | Reduce gesture check freq to 50Hz |
| Smoothness | Use 60 FPS rendering |
| Accuracy | Increase cooldown threshold |
| Battery | Reduce audio streaming rate |
| Latency | Use local WiFi, not hotspot |

---

## 🎓 Learning Path

1. **Day 1**: Setup & test basic connection
2. **Day 2**: Try all gestures and voices
3. **Day 3**: Customize AI responses
4. **Day 4**: Add custom gestures
5. **Day 5+**: Advanced customization

---

## 📚 Documentation Map

| File | Purpose |
|------|---------|
| README.md | 📖 Main overview |
| config/SETUP.md | ⚙️ Configuration |
| docs/DEVELOPER_GUIDE.md | 👨‍💻 Development |
| docs/API_REFERENCE.md | 🌐 API protocol |
| docs/TESTING_GUIDE.md | 🧪 Testing |
| PROJECT_SUMMARY.md | 📋 Project details |

---

## 💻 System Requirements

### M5StickC Plus 2
- WiFi module
- IMU sensor
- Microphone
- ~200KB flash

### Backend (Python)
- Python 3.8+
- 500MB disk space
- Internet (for cloud AI)

### Frontend (Browser)
- Modern browser (Chrome/Firefox/Safari/Edge)
- JavaScript enabled
- WebGL support

---

## 🎯 Key Features

✅ 7 gesture types
✅ Real-time animation
✅ Voice recognition
✅ AI responses
✅ 3D avatar
✅ Emotion display
✅ Multi-device support
✅ Low latency (<100ms typically)

---

## 🚀 Advanced Topics

### Add Custom Gesture
→ See `docs/DEVELOPER_GUIDE.md` - "Adding New Gestures"

### Custom Animation
→ See `docs/DEVELOPER_GUIDE.md` - "Adding New Animations"

### Change AI Model
→ See `config/SETUP.md` - "AI Model Options"

### Deploy to Cloud
→ See `docs/DEVELOPER_GUIDE.md` - "Deployment"

---

## 📞 Support

| Issue | Reference |
|-------|-----------|
| Setup problems | `config/SETUP.md` |
| Development help | `docs/DEVELOPER_GUIDE.md` |
| API questions | `docs/API_REFERENCE.md` |
| Testing issues | `docs/TESTING_GUIDE.md` |

---

## ✨ Pro Tips

1. **Faster Setup**: Use `start.sh` script
2. **Better Gestures**: Larger, slower movements
3. **Smooth Avatar**: Reduce animation duration in code
4. **Better Responses**: Use GPT-4 (more expensive but better)
5. **Battery Life**: Reduce sensor read frequency
6. **Network**: Use 5GHz WiFi if available
7. **Latency**: Ping your server: `ping <server-ip>`

---

## 🎉 You're Ready!

Everything you need is in place:
- ✅ Working firmware
- ✅ Complete backend
- ✅ Beautiful frontend
- ✅ Full documentation
- ✅ Testing tools
- ✅ Customization guides

**Next Step**: Run `start.sh` or follow the Quick Start above!

---

*For detailed information, see the full documentation.*
*Questions? Check the relevant guide file.*
*Ready to customize? See DEVELOPER_GUIDE.md*

**Let's build! 🚀**

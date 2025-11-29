"""
Wearable AI Companion - Backend Server
Handles:
- WebSocket connections from M5StickC Plus 2
- Voice recognition and transcription
- AI model inference (local or cloud)
- Gesture-to-intent mapping
- Animation and audio response generation
"""

import asyncio
import json
import base64
import numpy as np
from typing import Optional, Dict
from datetime import datetime
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# AI and Speech modules
try:
    import speech_recognition as sr
    HAS_SPEECH = True
except ImportError:
    HAS_SPEECH = False

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

try:
    import pyttsx3
    HAS_TTS = True
except ImportError:
    HAS_TTS = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
class Config:
    SERVER_HOST = "0.0.0.0"
    SERVER_PORT = 8765
    OPENAI_API_KEY = "your_openai_key_here"  # Load from env
    USE_LOCAL_AI = True
    MAX_AUDIO_BUFFER = 16000 * 5  # 5 seconds at 16kHz
    
# Gesture to intent mapping
GESTURE_INTENTS = {
    "wave": {"intent": "greet", "animation": "wave_back", "emotion": "happy"},
    "flick": {"intent": "scroll", "animation": "scroll_gesture", "emotion": "neutral"},
    "shake": {"intent": "refresh", "animation": "shake_head", "emotion": "confused"},
    "tilt_left": {"intent": "turn_left", "animation": "look_left", "emotion": "curious"},
    "tilt_right": {"intent": "turn_right", "animation": "look_right", "emotion": "curious"},
    "rotate_cw": {"intent": "rotate_right", "animation": "spin_right", "emotion": "happy"},
    "rotate_ccw": {"intent": "rotate_left", "animation": "spin_left", "emotion": "happy"},
}

# Initialize FastAPI
app = FastAPI()

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="frontend"), name="static")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")

# Connection manager for WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        del self.active_connections[client_id]
        logger.info(f"Client {client_id} disconnected")
    
    async def send_to_client(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(data)
    
    async def broadcast(self, data: dict):
        for connection in self.active_connections.values():
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.error(f"Error broadcasting: {e}")

manager = ConnectionManager()

# AI Backend Interface
class AIBackend:
    def __init__(self):
        self.openai_client = None
        self.speech_recognizer = None
        self.tts_engine = None
        self.initialize()
    
    def initialize(self):
        """Initialize AI components"""
        if HAS_OPENAI:
            self.openai_client = OpenAI(api_key=Config.OPENAI_API_KEY)
        
        if HAS_SPEECH:
            self.speech_recognizer = sr.Recognizer()
        
        if HAS_TTS:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', 150)
    
    async def transcribe_audio(self, audio_data: bytes) -> Optional[str]:
        """Convert audio bytes to text"""
        if not HAS_SPEECH:
            logger.warning("Speech recognition not available")
            return None
        
        try:
            # Convert bytes to audio data
            audio = sr.AudioData(audio_data, 16000, 2)
            text = self.speech_recognizer.recognize_google(audio)
            logger.info(f"Transcribed: {text}")
            return text
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return None
    
    async def generate_response(self, user_input: str, context: dict) -> tuple[str, dict]:
        """Generate AI response using LLM"""
        if not HAS_OPENAI:
            return "I'm listening!", {"emotion": "listening", "animation": "nod"}
        
        try:
            # Build context for the AI
            system_prompt = """You are a friendly AI companion living on a wearable device. 
You are enthusiastic, helpful, and engaging. Keep responses brief (1-2 sentences).
You detect the user's gestures and respond appropriately with emotion and personality."""
            
            # Include gesture context if available
            gesture = context.get("gesture")
            if gesture:
                system_prompt += f"\nThe user just made a {gesture['gesture']} gesture."
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_input}
                ],
                max_tokens=100,
                temperature=0.7
            )
            
            text = response.choices[0].message.content
            
            # Determine emotion based on response
            emotion = self._detect_emotion(text)
            animation = self._select_animation(user_input, gesture)
            
            return text, {"emotion": emotion, "animation": animation}
        
        except Exception as e:
            logger.error(f"Response generation error: {e}")
            return "I'm having trouble understanding.", {"emotion": "confused", "animation": "shake_head"}
    
    async def generate_speech(self, text: str) -> bytes:
        """Convert text to speech"""
        if not HAS_TTS:
            logger.warning("TTS not available")
            return b""
        
        try:
            # This is a placeholder - use actual TTS library
            # In production, use gTTS or a similar service
            logger.info(f"Generating speech for: {text}")
            return b"audio_bytes_placeholder"
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return b""
    
    def _detect_emotion(self, text: str) -> str:
        """Simple emotion detection based on text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ["happy", "great", "wonderful", "excellent", "!"]):
            return "happy"
        elif any(word in text_lower for word in ["sad", "sorry", "unfortunate"]):
            return "sad"
        elif any(word in text_lower for word in ["confused", "what", "?"]):
            return "confused"
        elif any(word in text_lower for word in ["angry", "wrong", "bad"]):
            return "angry"
        else:
            return "neutral"
    
    def _select_animation(self, user_input: str, gesture: Optional[dict]) -> str:
        """Select animation based on input and gesture"""
        if gesture:
            return GESTURE_INTENTS.get(gesture.get("gesture"), {}).get("animation", "idle")
        return "nod"

# Initialize AI backend
ai_backend = AIBackend()

# Routes
@app.get("/")
async def get_homepage():
    """Serve the main webpage"""
    try:
        return FileResponse("frontend/index.html")
    except FileNotFoundError:
        return HTMLResponse("<h1>Wearable AI Companion</h1><p>Frontend files not found. Please ensure frontend/index.html exists.</p>")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "speech_recognition": HAS_SPEECH,
            "openai": HAS_OPENAI,
            "text_to_speech": HAS_TTS
        }
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(client_id: str, websocket: WebSocket):
    """WebSocket endpoint for M5StickC Plus 2 and web clients"""
    await manager.connect(client_id, websocket)
    
    audio_buffer = bytearray()
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            logger.info(f"Received {msg_type} from {client_id}")
            
            # Handle gesture data
            if msg_type == "gesture":
                gesture = message.get("gesture")
                intent_data = GESTURE_INTENTS.get(gesture, {})
                
                # Generate AI response
                response_text, animation_data = await ai_backend.generate_response(
                    f"User made a {gesture} gesture",
                    {"gesture": message}
                )
                
                # Send response to all clients
                response_msg = {
                    "type": "response",
                    "gesture": gesture,
                    "text": response_text,
                    "animation": animation_data["animation"],
                    "emotion": animation_data["emotion"],
                    "timestamp": datetime.now().isoformat()
                }
                await manager.broadcast(response_msg)
            
            # Handle audio data
            elif msg_type == "audio":
                audio_base64 = message.get("data", "")
                audio_chunk = base64.b64decode(audio_base64)
                audio_buffer.extend(audio_chunk)
                
                # When buffer reaches sufficient size, transcribe
                if len(audio_buffer) >= Config.MAX_AUDIO_BUFFER:
                    transcribed_text = await ai_backend.transcribe_audio(bytes(audio_buffer))
                    
                    if transcribed_text:
                        # Generate AI response
                        response_text, animation_data = await ai_backend.generate_response(
                            transcribed_text,
                            {}
                        )
                        
                        # Generate speech
                        speech_bytes = await ai_backend.generate_speech(response_text)
                        
                        response_msg = {
                            "type": "voice_response",
                            "transcribed": transcribed_text,
                            "response": response_text,
                            "emotion": animation_data["emotion"],
                            "animation": animation_data["animation"],
                            "audio": base64.b64encode(speech_bytes).decode() if speech_bytes else "",
                            "timestamp": datetime.now().isoformat()
                        }
                        await manager.broadcast(response_msg)
                    
                    audio_buffer.clear()
            
            # Handle button presses
            elif msg_type == "button":
                button = message.get("button")
                logger.info(f"Button {button} pressed")
                
                button_responses = {
                    "A": {"text": "Button A pressed!", "animation": "wave"},
                    "B": {"text": "Button B pressed!", "animation": "point"}
                }
                
                response_data = button_responses.get(button, {})
                response_msg = {
                    "type": "button_response",
                    "button": button,
                    "response": response_data.get("text", ""),
                    "animation": response_data.get("animation", "idle"),
                    "emotion": "happy"
                }
                await manager.broadcast(response_msg)
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")

if __name__ == "__main__":
    logger.info("Starting Wearable AI Companion Backend Server...")
    uvicorn.run(
        app,
        host=Config.SERVER_HOST,
        port=Config.SERVER_PORT,
        log_level="info"
    )

// Main Application Controller
class AICompanionApp {
    constructor() {
        this.ws = null;
        this.avatar = null;
        this.clientId = this.generateClientId();
        this.gestureHistory = [];
        this.maxHistorySize = 10;
        this.currentEmotion = 'neutral';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.emotionIcons = {
            happy: '😊',
            sad: '😢',
            angry: '😠',
            confused: '🤔',
            neutral: '😐',
            listening: '👂',
            excited: '🤩'
        };
        
        this.init();
    }
    
    init() {
        // Initialize avatar
        const avatarContainer = document.getElementById('canvas').parentElement;
        this.avatar = new AvatarController(avatarContainer);
        
        // Setup UI event listeners
        this.setupUIListeners();
        
        // Connect to WebSocket
        this.connect();
        
        // Update connection status
        this.updateStatus('connecting');
    }
    
    setupUIListeners() {
        document.getElementById('btnWave').addEventListener('click', () => this.simulateGesture('wave'));
        document.getElementById('btnShake').addEventListener('click', () => this.simulateGesture('shake'));
        document.getElementById('btnClear').addEventListener('click', () => this.clearGestureLog());
        document.getElementById('btnSettings').addEventListener('click', () => this.openSettings());
    }
    
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
        const wsUrl = `${protocol}//${host}:${port}/ws/${this.clientId}`;
        
        console.log(`Connecting to ${wsUrl}`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => this.handleOpen();
        this.ws.onmessage = (event) => this.handleMessage(event.data);
        this.ws.onerror = (error) => this.handleError(error);
        this.ws.onclose = () => this.handleClose();
    }
    
    handleOpen() {
        console.log('WebSocket connected');
        this.updateStatus('connected');
        this.reconnectAttempts = 0;
        
        // Send initial handshake
        this.send({
            type: 'handshake',
            clientId: this.clientId,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    }
    
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received:', message);
            
            switch(message.type) {
                case 'gesture':
                    this.handleGestureResponse(message);
                    break;
                
                case 'response':
                    this.handleAIResponse(message);
                    break;
                
                case 'voice_response':
                    this.handleVoiceResponse(message);
                    break;
                
                case 'animation':
                    this.handleAnimationCommand(message);
                    break;
                
                case 'emotion':
                    this.handleEmotionUpdate(message);
                    break;
                
                default:
                    console.log('Unknown message type:', message.type);
            }
        } catch(error) {
            console.error('Error parsing message:', error);
        }
    }
    
    handleGestureResponse(message) {
        const gesture = message.gesture;
        const intensity = message.intensity || 1.0;
        
        // Add to history
        this.addGestureToLog(gesture, intensity);
        
        // Update avatar animation
        if(message.animation) {
            this.avatar.playAnimation(message.animation);
        }
        
        // Update emotion
        if(message.emotion) {
            this.setEmotion(message.emotion);
        }
        
        // Display text
        if(message.text) {
            this.displayText(message.text);
        }
    }
    
    handleAIResponse(message) {
        const text = message.text || '';
        const animation = message.animation || 'nod';
        const emotion = message.emotion || 'neutral';
        
        // Play animation
        this.avatar.playAnimation(animation);
        
        // Set emotion
        this.setEmotion(emotion);
        
        // Display response
        this.displayText(text);
        
        // Play audio if available
        if(message.audio) {
            this.playAudio(message.audio);
        }
    }
    
    handleVoiceResponse(message) {
        const transcribed = message.transcribed || '';
        const response = message.response || '';
        const emotion = message.emotion || 'neutral';
        const animation = message.animation || 'nod';
        
        console.log('Transcribed:', transcribed);
        console.log('Response:', response);
        
        // Show what was heard
        this.displayText(`You: "${transcribed}"\n\nAI: ${response}`);
        
        // Play animations
        this.avatar.playAnimation(animation);
        this.setEmotion(emotion);
        
        // Play audio response
        if(message.audio) {
            this.playAudio(message.audio);
        }
    }
    
    handleAnimationCommand(message) {
        const animation = message.animation || 'idle';
        this.avatar.playAnimation(animation);
    }
    
    handleEmotionUpdate(message) {
        const emotion = message.emotion || 'neutral';
        this.setEmotion(emotion);
    }
    
    handleError(error) {
        console.error('WebSocket error:', error);
        this.updateStatus('error');
    }
    
    handleClose() {
        console.log('WebSocket closed');
        this.updateStatus('disconnected');
        
        // Attempt to reconnect
        if(this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = 2000 * (this.reconnectAttempts + 1);
            console.log(`Reconnecting in ${delay}ms...`);
            setTimeout(() => this.connect(), delay);
            this.reconnectAttempts++;
        } else {
            console.error('Max reconnection attempts reached');
        }
    }
    
    send(data) {
        if(this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected');
        }
    }
    
    simulateGesture(gesture) {
        const intensities = {
            wave: 0.8,
            flick: 0.9,
            shake: 0.7,
            tilt_left: 0.6,
            tilt_right: 0.6,
            rotate_cw: 0.8,
            rotate_ccw: 0.8
        };
        
        const message = {
            type: 'gesture',
            gesture: gesture,
            intensity: intensities[gesture] || 0.5,
            timestamp: Date.now()
        };
        
        this.send(message);
        
        // Local animation playback
        const animationMap = {
            wave: 'wave',
            flick: 'point',
            shake: 'shake_head',
            tilt_left: 'look_left',
            tilt_right: 'look_right',
            rotate_cw: 'spin_right',
            rotate_ccw: 'spin_right'
        };
        
        this.avatar.playAnimation(animationMap[gesture] || 'idle');
        this.addGestureToLog(gesture, intensities[gesture]);
    }
    
    addGestureToLog(gesture, intensity = 1.0) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            gesture: gesture,
            intensity: intensity.toFixed(2),
            timestamp: timestamp
        };
        
        this.gestureHistory.unshift(entry);
        if(this.gestureHistory.length > this.maxHistorySize) {
            this.gestureHistory.pop();
        }
        
        this.updateGestureLog();
    }
    
    updateGestureLog() {
        const logContainer = document.getElementById('gestureLog');
        logContainer.innerHTML = '';
        
        this.gestureHistory.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'gesture-item';
            div.innerHTML = `<strong>${entry.gesture}</strong> (${entry.intensity}) - ${entry.timestamp}`;
            logContainer.appendChild(div);
        });
    }
    
    clearGestureLog() {
        this.gestureHistory = [];
        this.updateGestureLog();
        this.displayText('Gesture log cleared');
    }
    
    setEmotion(emotion) {
        this.currentEmotion = emotion;
        this.avatar.setEmotion(emotion);
        
        // Update emotion display
        const emotionIcon = this.emotionIcons[emotion] || this.emotionIcons.neutral;
        const emotionText = emotion.charAt(0).toUpperCase() + emotion.slice(1);
        
        document.getElementById('emotionIcon').textContent = emotionIcon;
        document.getElementById('emotionText').textContent = emotionText;
    }
    
    displayText(text) {
        const textDisplay = document.getElementById('textDisplay');
        textDisplay.textContent = text;
        textDisplay.classList.remove('empty');
        
        // Auto-clear after 5 seconds if no new text
        setTimeout(() => {
            if(textDisplay.textContent === text) {
                textDisplay.textContent = 'Waiting for input...';
                textDisplay.classList.add('empty');
            }
        }, 5000);
    }
    
    playAudio(audioBase64) {
        try {
            const audioData = atob(audioBase64);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for(let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(audioContext.destination);
                source.start(0);
            });
        } catch(error) {
            console.error('Error playing audio:', error);
        }
    }
    
    updateStatus(status) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        const statusConfig = {
            connected: { class: 'connected', text: 'Connected' },
            disconnected: { class: 'disconnected', text: 'Disconnected' },
            connecting: { class: 'disconnected', text: 'Connecting...' },
            error: { class: 'disconnected', text: 'Error' }
        };
        
        const config = statusConfig[status] || statusConfig.disconnected;
        statusDot.className = `status-dot ${config.class}`;
        statusText.textContent = config.text;
    }
    
    openSettings() {
        // Placeholder for settings modal
        alert('Settings panel coming soon!\n\n- WiFi Configuration\n- AI Model Selection\n- Audio Settings\n- Display Preferences');
    }
    
    generateClientId() {
        return `web_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AICompanionApp();
});

#ifndef GESTURE_DETECTOR_H
#define GESTURE_DETECTOR_H

#include <stdint.h>
#include <math.h>

// Gesture types
enum GestureType {
    GESTURE_NONE = 0,
    GESTURE_WAVE = 1,
    GESTURE_FLICK = 2,
    GESTURE_SHAKE = 3,
    GESTURE_TILT_LEFT = 4,
    GESTURE_TILT_RIGHT = 5,
    GESTURE_ROTATE_CW = 6,
    GESTURE_ROTATE_CCW = 7
};

struct Gesture {
    GestureType type;
    float intensity;
    uint32_t timestamp;
};

class GestureDetector {
private:
    // Buffers for historical data
    static const int BUFFER_SIZE = 20;
    float accelXBuf[BUFFER_SIZE];
    float accelYBuf[BUFFER_SIZE];
    float accelZBuf[BUFFER_SIZE];
    float gyroXBuf[BUFFER_SIZE];
    float gyroYBuf[BUFFER_SIZE];
    float gyroZBuf[BUFFER_SIZE];
    int bufferIndex;
    
    // Thresholds
    const float ACCEL_THRESHOLD = 2.0;      // m/s^2
    const float GYRO_THRESHOLD = 50.0;      // deg/s
    const float WAVE_ACCEL_MIN = 1.5;
    const float WAVE_ACCEL_MAX = 3.0;
    const float SHAKE_INTENSITY = 4.0;
    
    // Last detected gesture time
    uint32_t lastGestureTime;
    const uint32_t GESTURE_COOLDOWN = 500;  // ms
    
public:
    GestureDetector() : bufferIndex(0), lastGestureTime(0) {
        memset(accelXBuf, 0, sizeof(accelXBuf));
        memset(accelYBuf, 0, sizeof(accelYBuf));
        memset(accelZBuf, 0, sizeof(accelZBuf));
        memset(gyroXBuf, 0, sizeof(gyroXBuf));
        memset(gyroYBuf, 0, sizeof(gyroYBuf));
        memset(gyroZBuf, 0, sizeof(gyroZBuf));
    }
    
    void init() {
        // Initialize detector
    }
    
    Gesture detect(float ax, float ay, float az, float gx, float gy, float gz) {
        Gesture gesture;
        gesture.type = GESTURE_NONE;
        gesture.intensity = 0.0;
        gesture.timestamp = millis();
        
        // Add to buffer
        accelXBuf[bufferIndex] = ax;
        accelYBuf[bufferIndex] = ay;
        accelZBuf[bufferIndex] = az;
        gyroXBuf[bufferIndex] = gx;
        gyroYBuf[bufferIndex] = gy;
        gyroZBuf[bufferIndex] = gz;
        bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;
        
        // Check gesture cooldown
        if(gesture.timestamp - lastGestureTime < GESTURE_COOLDOWN) {
            return gesture;
        }
        
        // Detect gestures
        if(detectWave(gesture)) return gesture;
        if(detectFlick(gesture)) return gesture;
        if(detectShake(gesture)) return gesture;
        if(detectTilt(gesture)) return gesture;
        if(detectRotation(gesture)) return gesture;
        
        return gesture;
    }
    
private:
    bool detectWave(Gesture &gesture) {
        // Wave: large oscillation in Y-axis with moderate X variation
        float avgY = 0, maxY = 0, minY = 0;
        
        for(int i = 0; i < BUFFER_SIZE; i++) {
            avgY += accelYBuf[i];
            if(accelYBuf[i] > maxY) maxY = accelYBuf[i];
            if(accelYBuf[i] < minY) minY = accelYBuf[i];
        }
        avgY /= BUFFER_SIZE;
        float rangeY = maxY - minY;
        
        if(rangeY > WAVE_ACCEL_MIN && rangeY < WAVE_ACCEL_MAX) {
            gesture.type = GESTURE_WAVE;
            gesture.intensity = rangeY / WAVE_ACCEL_MAX;
            lastGestureTime = millis();
            return true;
        }
        return false;
    }
    
    bool detectFlick(Gesture &gesture) {
        // Flick: sudden high acceleration spike
        float maxAccel = 0;
        
        for(int i = 0; i < BUFFER_SIZE; i++) {
            float accel = sqrt(accelXBuf[i]*accelXBuf[i] + 
                              accelYBuf[i]*accelYBuf[i] + 
                              accelZBuf[i]*accelZBuf[i]);
            if(accel > maxAccel) maxAccel = accel;
        }
        
        if(maxAccel > 5.0) {
            gesture.type = GESTURE_FLICK;
            gesture.intensity = min(1.0f, maxAccel / 10.0f);
            lastGestureTime = millis();
            return true;
        }
        return false;
    }
    
    bool detectShake(Gesture &gesture) {
        // Shake: rapid oscillations in multiple axes
        int zeroXings = 0;
        
        for(int i = 1; i < BUFFER_SIZE; i++) {
            if((accelXBuf[i-1] > 0 && accelXBuf[i] < 0) ||
               (accelXBuf[i-1] < 0 && accelXBuf[i] > 0)) {
                zeroXings++;
            }
        }
        
        if(zeroXings > 8) {  // More than 8 zero crossings = shake
            gesture.type = GESTURE_SHAKE;
            gesture.intensity = min(1.0f, (float)zeroXings / 15.0f);
            lastGestureTime = millis();
            return true;
        }
        return false;
    }
    
    bool detectTilt(Gesture &gesture) {
        // Tilt: sustained acceleration in one direction
        float avgX = 0, avgY = 0;
        
        for(int i = 0; i < BUFFER_SIZE; i++) {
            avgX += accelXBuf[i];
            avgY += accelYBuf[i];
        }
        avgX /= BUFFER_SIZE;
        avgY /= BUFFER_SIZE;
        
        if(avgX > ACCEL_THRESHOLD) {
            gesture.type = GESTURE_TILT_RIGHT;
            gesture.intensity = min(1.0f, avgX / 5.0f);
            lastGestureTime = millis();
            return true;
        }
        if(avgX < -ACCEL_THRESHOLD) {
            gesture.type = GESTURE_TILT_LEFT;
            gesture.intensity = min(1.0f, fabs(avgX) / 5.0f);
            lastGestureTime = millis();
            return true;
        }
        return false;
    }
    
    bool detectRotation(Gesture &gesture) {
        // Rotation: sustained gyro movement
        float avgGX = 0, avgGZ = 0;
        
        for(int i = 0; i < BUFFER_SIZE; i++) {
            avgGX += gyroXBuf[i];
            avgGZ += gyroZBuf[i];
        }
        avgGX /= BUFFER_SIZE;
        avgGZ /= BUFFER_SIZE;
        
        if(avgGZ > GYRO_THRESHOLD) {
            gesture.type = GESTURE_ROTATE_CW;
            gesture.intensity = min(1.0f, avgGZ / 300.0f);
            lastGestureTime = millis();
            return true;
        }
        if(avgGZ < -GYRO_THRESHOLD) {
            gesture.type = GESTURE_ROTATE_CCW;
            gesture.intensity = min(1.0f, fabs(avgGZ) / 300.0f);
            lastGestureTime = millis();
            return true;
        }
        return false;
    }
};

#endif // GESTURE_DETECTOR_H

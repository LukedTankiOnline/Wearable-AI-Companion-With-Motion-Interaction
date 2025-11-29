// Avatar 3D Model and Animations
class AvatarController {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatar = null;
        this.animationMixer = null;
        this.actions = {};
        this.currentEmotion = 'neutral';
        this.currentAnimation = 'idle';
        
        this.init();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 1000);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 3);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Lighting
        this.setupLighting();
        
        // Create avatar
        this.createAvatar();
        
        // Start animation loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);
        
        // Point light for accent
        const pointLight = new THREE.PointLight(0x667eea, 0.5);
        pointLight.position.set(-5, 3, 5);
        this.scene.add(pointLight);
    }
    
    createAvatar() {
        // Create a simple humanoid avatar using geometric shapes
        const avatarGroup = new THREE.Group();
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5a962,
            metalness: 0.1,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        head.receiveShadow = true;
        avatarGroup.add(head);
        this.head = head;
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 1.4, 0.45);
        avatarGroup.add(leftEye);
        this.leftEye = leftEye;
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 1.4, 0.45);
        avatarGroup.add(rightEye);
        this.rightEye = rightEye;
        
        // Mouth
        const mouthCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.2, 0.8, 0.45),
            new THREE.Vector3(0, 1.0, 0.45),
            new THREE.Vector3(0.2, 0.8, 0.45)
        ]);
        const mouthGeometry = new THREE.TubeGeometry(mouthCurve, 20, 0.02, 8);
        const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b9d });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        avatarGroup.add(mouth);
        this.mouth = mouth;
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 16, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x667eea,
            metalness: 0.2,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.2;
        body.castShadow = true;
        body.receiveShadow = true;
        avatarGroup.add(body);
        this.body = body;
        
        // Left arm
        const leftArmGeometry = new THREE.CapsuleGeometry(0.15, 1.0, 16, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5a962,
            metalness: 0.1,
            roughness: 0.8
        });
        const leftArm = new THREE.Mesh(leftArmGeometry, armMaterial);
        leftArm.position.set(-0.6, 0.8, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        avatarGroup.add(leftArm);
        this.leftArm = leftArm;
        
        // Right arm
        const rightArm = new THREE.Mesh(leftArmGeometry, armMaterial);
        rightArm.position.set(0.6, 0.8, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        avatarGroup.add(rightArm);
        this.rightArm = rightArm;
        
        // Left leg
        const legGeometry = new THREE.CapsuleGeometry(0.15, 1.0, 16, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.1,
            roughness: 0.9
        });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.25, -1, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        avatarGroup.add(leftLeg);
        this.leftLeg = leftLeg;
        
        // Right leg
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.25, -1, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        avatarGroup.add(rightLeg);
        this.rightLeg = rightLeg;
        
        // Add ground shadow
        const shadowGeometry = new THREE.PlaneGeometry(3, 3);
        const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -1.5;
        shadowPlane.receiveShadow = true;
        this.scene.add(shadowPlane);
        
        this.avatar = avatarGroup;
        this.scene.add(avatarGroup);
        
        // Setup animation mixer
        this.animationMixer = new THREE.AnimationMixer(avatarGroup);
        this.setupAnimations();
    }
    
    setupAnimations() {
        // Idle animation - slight sway
        this.actions.idle = {
            animate: () => {
                const time = Date.now() * 0.001;
                this.avatar.position.y = Math.sin(time * 0.5) * 0.1;
                this.head.rotation.y = Math.sin(time * 0.3) * 0.1;
            }
        };
        
        // Wave animation
        this.actions.wave = {
            animate: (() => {
                let startTime = Date.now();
                return () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    if(elapsed > 1.5) {
                        startTime = Date.now();
                    }
                    
                    const phase = elapsed * Math.PI * 2;
                    this.rightArm.rotation.z = Math.sin(phase) * 0.8 - 0.5;
                    this.rightArm.rotation.x = 0.3;
                };
            })()
        };
        
        // Point animation
        this.actions.point = {
            animate: () => {
                this.rightArm.rotation.z = -0.3;
                this.rightArm.rotation.x = 0.2;
                this.head.rotation.y = 0.3;
            }
        };
        
        // Nod animation
        this.actions.nod = {
            animate: (() => {
                let startTime = Date.now();
                return () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    if(elapsed > 1) {
                        startTime = Date.now();
                    }
                    
                    const phase = elapsed * Math.PI;
                    this.head.rotation.x = Math.sin(phase) * 0.3;
                };
            })()
        };
        
        // Shake head animation
        this.actions.shake_head = {
            animate: (() => {
                let startTime = Date.now();
                return () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    if(elapsed > 1.2) {
                        startTime = Date.now();
                    }
                    
                    const phase = elapsed * Math.PI * 3;
                    this.head.rotation.y = Math.sin(phase) * 0.4;
                };
            })()
        };
        
        // Spin animation
        this.actions.spin_right = {
            animate: (() => {
                let startTime = Date.now();
                return () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    if(elapsed > 2) {
                        startTime = Date.now();
                    }
                    
                    this.avatar.rotation.y = (elapsed / 2) * Math.PI * 2;
                };
            })()
        };
        
        // Look animation
        this.actions.look_left = {
            animate: () => {
                this.head.rotation.y = 0.5;
                this.leftEye.position.x = -0.25;
            }
        };
        
        this.actions.look_right = {
            animate: () => {
                this.head.rotation.y = -0.5;
                this.rightEye.position.x = 0.25;
            }
        };
    }
    
    setEmotion(emotion) {
        this.currentEmotion = emotion;
        
        // Update colors and expressions based on emotion
        const emotionConfig = {
            happy: { eyeScale: 1.3, mouthHeight: 1.2, headColor: 0xf5a962 },
            sad: { eyeScale: 0.8, mouthHeight: 0.8, headColor: 0xcccccc },
            angry: { eyeScale: 0.7, mouthHeight: 0.5, headColor: 0xff6b6b },
            confused: { eyeScale: 1.1, mouthHeight: 0.9, headColor: 0xf5d547 },
            neutral: { eyeScale: 1.0, mouthHeight: 1.0, headColor: 0xf5a962 },
            listening: { eyeScale: 1.2, mouthHeight: 0.6, headColor: 0x667eea }
        };
        
        const config = emotionConfig[emotion] || emotionConfig.neutral;
        
        this.leftEye.scale.set(config.eyeScale, config.eyeScale, config.eyeScale);
        this.rightEye.scale.set(config.eyeScale, config.eyeScale, config.eyeScale);
        this.head.material.color.setHex(config.headColor);
    }
    
    playAnimation(animationName) {
        this.currentAnimation = animationName;
        if(!this.actions[animationName]) {
            this.currentAnimation = 'idle';
        }
    }
    
    animate = () => {
        requestAnimationFrame(this.animate);
        
        // Update current animation
        if(this.actions[this.currentAnimation] && this.actions[this.currentAnimation].animate) {
            this.actions[this.currentAnimation].animate();
        }
        
        // Always do idle sway
        if(this.currentAnimation === 'idle') {
            this.actions.idle.animate();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

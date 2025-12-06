// Mobile-Optimized Endless Driver Game
// Built with performance in mind for smooth gameplay on all devices

class EndlessDriverGame {
    constructor() {
        // Canvas and context
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { 
            alpha: false,
            desynchronized: true // Enable low-latency rendering
        });
        
        // Game state
        this.gameState = 'loading';
        this.score = 0;
        this.gameSpeed = 5;
        this.frameCount = 0;
        
        // Performance monitoring
        this.fps = 60;
        this.lastFrameTime = performance.now();
        this.frameTimeAccumulator = 0;
        this.frameCountForFPS = 0;
        this.deltaTime = 0;
        
        // Adaptive quality
        this.lowFPSCount = 0;
        this.qualityLevel = 1; // 1 = high, 0.75 = medium, 0.5 = low
        
        // Player
        this.player = {
            x: 0,
            y: 0,
            width: 40,
            height: 60,
            lane: 1, // 0=left, 1=center, 2=right
            color: '#00d2ff'
        };
        
        // Obstacles with object pooling
        this.obstacles = [];
        this.obstaclePool = [];
        this.obstacleSpawnTimer = 0;
        this.obstacleSpawnInterval = 100;
        this.maxObstacles = 10;
        
        // Road lanes
        this.lanes = [0.25, 0.5, 0.75]; // Relative positions
        this.laneWidth = 0;
        
        // Input handling
        this.keys = {};
        this.touchInput = { x: 0, y: 0, active: false };
        this.swipeStartX = 0;
        this.swipeThreshold = 50;
        this.lastInputTime = 0;
        this.inputThrottle = 16; // ~60 FPS
        
        // Asset loading
        this.assetsLoaded = false;
        
        // Dynamic resolution scaling
        this.pixelRatio = this.getOptimalPixelRatio();
        
        // Rendering optimization flags
        this.roadStyleCached = false;
        
        this.init();
    }
    
    getOptimalPixelRatio() {
        // Detect device capabilities and adjust pixel ratio
        const dpr = window.devicePixelRatio || 1;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Limit pixel ratio on lower-end devices
        if (isMobile) {
            return Math.min(dpr, 2);
        }
        return Math.min(dpr, 2.5);
    }
    
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.loadAssets();
    }
    
    resizeCanvas() {
        // Get viewport dimensions
        const container = document.getElementById('game-container');
        const rect = container.getBoundingClientRect();
        
        // Set display size
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Set actual size with pixel ratio for crisp rendering
        this.canvas.width = rect.width * this.pixelRatio;
        this.canvas.height = rect.height * this.pixelRatio;
        
        // Scale context to match pixel ratio
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        // Update game dimensions
        this.gameWidth = rect.width;
        this.gameHeight = rect.height;
        this.laneWidth = this.gameWidth / 3;
        
        // Update player position
        this.player.x = this.lanes[this.player.lane] * this.gameWidth - this.player.width / 2;
        this.player.y = this.gameHeight - this.player.height - 50;
    }
    
    setupEventListeners() {
        // Keyboard controls
        const preventDefaultKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (preventDefaultKeys.includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Touch controls - Joystick
        this.setupJoystick();
        
        // Touch controls - Swipe gestures
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.swipeStartX = e.touches[0].clientX;
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const swipeEndX = e.changedTouches[0].clientX;
            const swipeDelta = swipeEndX - this.swipeStartX;
            
            if (Math.abs(swipeDelta) > this.swipeThreshold) {
                if (swipeDelta > 0 && this.player.lane < 2) {
                    this.player.lane++;
                } else if (swipeDelta < 0 && this.player.lane > 0) {
                    this.player.lane--;
                }
            }
        }, { passive: false });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // UI buttons
        document.getElementById('start-button').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restart-button').addEventListener('click', () => {
            this.startGame();
        });
    }
    
    setupJoystick() {
        const joystickContainer = document.getElementById('joystick-container');
        const joystickStick = document.getElementById('joystick-stick');
        let joystickActive = false;
        
        const handleJoystickMove = (clientX, clientY) => {
            // Throttle input processing for better performance
            const now = performance.now();
            if (now - this.lastInputTime < this.inputThrottle) {
                return;
            }
            this.lastInputTime = now;
            
            const rect = joystickContainer.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = rect.width / 2;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(deltaY, deltaX);
                this.touchInput.x = Math.cos(angle) * maxDistance;
                this.touchInput.y = Math.sin(angle) * maxDistance;
            } else {
                this.touchInput.x = deltaX;
                this.touchInput.y = deltaY;
            }
            
            // Update joystick visual with transform (GPU accelerated)
            joystickStick.style.transform = `translate(calc(-50% + ${this.touchInput.x}px), calc(-50% + ${this.touchInput.y}px)) translateZ(0)`;
        };
        
        joystickContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            joystickActive = true;
            this.touchInput.active = true;
            handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        
        joystickContainer.addEventListener('touchmove', (e) => {
            if (joystickActive) {
                e.preventDefault();
                handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        
        joystickContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            joystickActive = false;
            this.touchInput.active = false;
            this.touchInput.x = 0;
            this.touchInput.y = 0;
            joystickStick.style.transform = 'translate(-50%, -50%) translateZ(0)';
        }, { passive: false });
    }
    
    loadAssets() {
        // Simulate asset loading with progress
        const loadingScreen = document.getElementById('loading-screen');
        const progress = document.getElementById('progress');
        const loadingText = document.getElementById('loading-text');
        
        let loaded = 0;
        const total = 100;
        
        const loadInterval = setInterval(() => {
            loaded += 10;
            const percent = (loaded / total) * 100;
            progress.style.width = percent + '%';
            
            if (loaded >= 50 && loaded < 80) {
                loadingText.textContent = 'Optimizing for your device...';
            } else if (loaded >= 80) {
                loadingText.textContent = 'Ready!';
            }
            
            if (loaded >= total) {
                clearInterval(loadInterval);
                this.assetsLoaded = true;
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    this.showStartScreen();
                }, 500);
            }
        }, 100);
    }
    
    showStartScreen() {
        document.getElementById('start-screen').classList.remove('hidden');
    }
    
    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = 5;
        
        // Return all active obstacles to pool before clearing
        for (const obstacle of this.obstacles) {
            this.returnObstacleToPool(obstacle);
        }
        this.obstacles = [];
        
        this.obstacleSpawnTimer = 0;
        this.player.lane = 1;
        this.frameCount = 0;
        this.deltaTime = 1;
        this.lastFrameTime = performance.now();
        
        this.gameLoop();
    }
    
    handleInput() {
        // Keyboard input
        if ((this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) && this.player.lane > 0) {
            if (this.frameCount % 10 === 0) {
                this.player.lane--;
            }
        }
        if ((this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) && this.player.lane < 2) {
            if (this.frameCount % 10 === 0) {
                this.player.lane++;
            }
        }
        
        // Joystick input
        if (this.touchInput.active) {
            const threshold = 20;
            if (this.touchInput.x < -threshold && this.player.lane > 0) {
                if (this.frameCount % 10 === 0) {
                    this.player.lane--;
                }
            } else if (this.touchInput.x > threshold && this.player.lane < 2) {
                if (this.frameCount % 10 === 0) {
                    this.player.lane++;
                }
            }
        }
        
        // Smooth lane transition
        const targetX = this.lanes[this.player.lane] * this.gameWidth - this.player.width / 2;
        this.player.x += (targetX - this.player.x) * 0.2;
    }
    
    update() {
        this.frameCount++;
        
        // Spawn obstacles
        this.obstacleSpawnTimer++;
        if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += this.gameSpeed * this.deltaTime;
            
            // Remove off-screen obstacles and return to pool
            if (obstacle.y > this.gameHeight) {
                this.obstacles.splice(i, 1);
                this.returnObstacleToPool(obstacle);
                this.score += 10;
                continue;
            }
            
            // Collision detection
            if (this.checkCollision(this.player, obstacle)) {
                this.gameOver();
                return;
            }
        }
        
        // Increase difficulty (every ~10 seconds at 60 FPS)
        if (this.frameCount % 600 === 0) {
            this.gameSpeed = Math.min(this.gameSpeed + 0.5, 15); // Cap max speed
            this.obstacleSpawnInterval = Math.max(50, this.obstacleSpawnInterval - 5);
        }
    }
    
    spawnObstacle() {
        // Limit active obstacles for performance
        if (this.obstacles.length >= this.maxObstacles) {
            return;
        }
        
        const lane = Math.floor(Math.random() * 3);
        
        // Try to reuse from pool
        let obstacle;
        if (this.obstaclePool.length > 0) {
            obstacle = this.obstaclePool.pop();
            obstacle.x = this.lanes[lane] * this.gameWidth - 35;
            obstacle.y = -80;
            obstacle.lane = lane;
        } else {
            // Create new obstacle if pool is empty
            obstacle = {
                x: this.lanes[lane] * this.gameWidth - 35,
                y: -80,
                width: 70,
                height: 80,
                lane: lane,
                color: '#ff4757'
            };
        }
        
        this.obstacles.push(obstacle);
    }
    
    returnObstacleToPool(obstacle) {
        // Return obstacle to pool for reuse
        if (this.obstaclePool.length < 20) {
            this.obstaclePool.push(obstacle);
        }
    }
    
    checkCollision(player, obstacle) {
        return player.x < obstacle.x + obstacle.width &&
               player.x + player.width > obstacle.x &&
               player.y < obstacle.y + obstacle.height &&
               player.y + player.height > obstacle.y;
    }
    
    render() {
        // Clear canvas efficiently
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw road
        this.drawRoad();
        
        // Batch draw obstacles (same color, one fillStyle call)
        this.ctx.fillStyle = '#ff4757';
        for (const obstacle of this.obstacles) {
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        
        // Draw player (separate color)
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Update score display only when changed (reduce DOM updates)
        const scoreElement = document.getElementById('score');
        const newScore = String(this.score);
        if (scoreElement.textContent !== newScore) {
            scoreElement.textContent = newScore;
        }
    }
    
    drawRoad() {
        // Draw lane dividers with scrolling effect
        const lineHeight = 40;
        const lineGap = 20;
        const offset = (this.frameCount * this.gameSpeed * this.deltaTime) % (lineHeight + lineGap);
        
        // Cache line style setup
        if (!this.roadStyleCached) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.lineWidth = 2;
            this.roadStyleCached = true;
        }
        
        this.ctx.setLineDash([lineHeight, lineGap]);
        
        // Draw both lane lines in one path for better performance
        const lane1X = this.gameWidth / 3;
        const lane2X = (this.gameWidth / 3) * 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(lane1X, -offset);
        this.ctx.lineTo(lane1X, this.gameHeight);
        this.ctx.moveTo(lane2X, -offset);
        this.ctx.lineTo(lane2X, this.gameHeight);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    updateFPS() {
        const currentTime = performance.now();
        const delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // Calculate normalized delta time (targeting 60 FPS)
        this.deltaTime = delta / (1000 / 60);
        
        this.frameTimeAccumulator += delta;
        this.frameCountForFPS++;
        
        // Update FPS display every 500ms
        if (this.frameTimeAccumulator >= 500) {
            this.fps = Math.round((this.frameCountForFPS * 1000) / this.frameTimeAccumulator);
            document.getElementById('fps').textContent = this.fps;
            
            // Adaptive quality: reduce quality if FPS drops
            if (this.fps < 45 && this.qualityLevel > 0.5) {
                this.lowFPSCount++;
                if (this.lowFPSCount > 3) {
                    this.qualityLevel = Math.max(0.5, this.qualityLevel - 0.25);
                    this.adjustQuality();
                    this.lowFPSCount = 0;
                }
            } else if (this.fps >= 55 && this.qualityLevel < 1) {
                this.lowFPSCount = 0;
                // Gradually restore quality
                this.safeRequestIdleCallback(() => {
                    if (this.fps >= 55) {
                        this.qualityLevel = Math.min(1, this.qualityLevel + 0.25);
                        this.adjustQuality();
                    }
                });
            } else {
                this.lowFPSCount = 0;
            }
            
            this.frameTimeAccumulator = 0;
            this.frameCountForFPS = 0;
        }
    }
    
    adjustQuality() {
        // Adjust rendering quality based on performance
        if (this.qualityLevel < 1) {
            // Reduce pixel ratio for better performance
            const reducedRatio = this.getOptimalPixelRatio() * this.qualityLevel;
            this.pixelRatio = Math.max(1, reducedRatio);
            this.resizeCanvas();
        }
    }
    
    safeRequestIdleCallback(callback) {
        // Polyfill for requestIdleCallback
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 100);
        }
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        this.update();
        this.render();
        this.updateFPS();
        
        // Use requestAnimationFrame for optimal performance
        requestAnimationFrame(() => this.gameLoop());
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new EndlessDriverGame();
    });
} else {
    new EndlessDriverGame();
}

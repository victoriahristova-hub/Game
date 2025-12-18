/* ========================================
   Christmas Cookie Adventure - Game Logic
   ======================================== */

// ========================================
// Game Configuration
// ========================================
const CONFIG = {
    playerSpeed: 5,          // How fast the cookie moves
    teacherSpeed: 2,         // How fast the teacher moves
    itemCount: 8,            // Number of items to collect
    gameWidth: 800,          // Game container width
    gameHeight: 500          // Game container height
};

// ========================================
// Game State
// ========================================
let gameState = {
    isRunning: false,
    score: 0,
    totalItems: CONFIG.itemCount,
    playerX: 400,
    playerY: 400,
    teacherX: 600,
    teacherY: 200,
    teacherDirectionX: 1,
    teacherDirectionY: 1,
    keysPressed: {},
    items: [],
    animationId: null
};

// ========================================
// DOM Elements
// ========================================
const screens = {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    gameOver: document.getElementById('gameover-screen'),
    win: document.getElementById('win-screen')
};

const elements = {
    player: document.getElementById('player'),
    teacher: document.getElementById('teacher'),
    gameContainer: document.getElementById('game-container'),
    score: document.getElementById('score'),
    totalItems: document.getElementById('total-items'),
    finalScore: document.getElementById('final-score')
};

const buttons = {
    start: document.getElementById('start-btn'),
    retry: document.getElementById('retry-btn'),
    playAgain: document.getElementById('play-again-btn')
};

// ========================================
// Screen Management
// ========================================

/**
 * Shows a specific screen and hides all others
 * @param {string} screenName - Name of the screen to show
 */
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// ========================================
// Item Generation
// ========================================

/**
 * Creates collectible items and places them randomly in the game area
 */
function createItems() {
    // Remove existing items
    document.querySelectorAll('.collectible').forEach(item => item.remove());
    gameState.items = [];

    // Item types with their display content
    const itemTypes = [
        { type: 'candy-cane', content: '🍬' },
        { type: 'star', content: '⭐' },
        { type: 'ornament', content: '🔴' },
        { type: 'gift', content: '🎁' }
    ];

    // Create items at random positions
    for (let i = 0; i < CONFIG.itemCount; i++) {
        const itemType = itemTypes[i % itemTypes.length];
        const item = document.createElement('div');
        item.className = `collectible ${itemType.type}`;
        item.textContent = itemType.content;
        
        // Random position (avoiding edges and decorations)
        let x, y;
        do {
            x = 100 + Math.random() * (CONFIG.gameWidth - 200);
            y = 50 + Math.random() * (CONFIG.gameHeight - 150);
        } while (isPositionBlocked(x, y));

        item.style.left = x + 'px';
        item.style.top = y + 'px';
        
        // Store item data for collision detection
        gameState.items.push({
            element: item,
            x: x,
            y: y,
            width: 30,
            height: 30,
            collected: false
        });

        elements.gameContainer.appendChild(item);
    }
}

/**
 * Checks if a position overlaps with obstacles
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {boolean} True if position is blocked
 */
function isPositionBlocked(x, y) {
    // Define blocked areas (lockers, blackboard, etc.)
    const blockedAreas = [
        { x: 50, y: 50, width: 40, height: 280 },   // Lockers
        { x: 600, y: 80, width: 150, height: 100 }, // Blackboard
        { x: 350, y: 30, width: 80, height: 100 },  // Christmas tree
        { x: 500, y: 350, width: 180, height: 80 }  // Desks
    ];

    for (const area of blockedAreas) {
        if (x > area.x - 30 && x < area.x + area.width &&
            y > area.y - 30 && y < area.y + area.height) {
            return true;
        }
    }
    return false;
}

// ========================================
// Player Movement
// ========================================

/**
 * Updates player position based on pressed keys
 */
function updatePlayerPosition() {
    const keys = gameState.keysPressed;
    let newX = gameState.playerX;
    let newY = gameState.playerY;

    // Arrow keys and WASD support
    if (keys['ArrowUp'] || keys['KeyW']) newY -= CONFIG.playerSpeed;
    if (keys['ArrowDown'] || keys['KeyS']) newY += CONFIG.playerSpeed;
    if (keys['ArrowLeft'] || keys['KeyA']) newX -= CONFIG.playerSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) newX += CONFIG.playerSpeed;

    // Keep player within bounds
    newX = Math.max(0, Math.min(CONFIG.gameWidth - 40, newX));
    newY = Math.max(25, Math.min(CONFIG.gameHeight - 50, newY));

    gameState.playerX = newX;
    gameState.playerY = newY;

    // Update player element position
    elements.player.style.left = newX + 'px';
    elements.player.style.top = newY + 'px';
}

// ========================================
// Teacher (Enemy) Movement
// ========================================

/**
 * Updates teacher position with simple AI movement
 * The teacher moves in a pattern and occasionally chases the player
 */
function updateTeacherPosition() {
    // Basic patrol movement with slight randomness
    gameState.teacherX += CONFIG.teacherSpeed * gameState.teacherDirectionX;
    gameState.teacherY += CONFIG.teacherSpeed * gameState.teacherDirectionY * 0.5;

    // Bounce off walls
    if (gameState.teacherX <= 100 || gameState.teacherX >= CONFIG.gameWidth - 100) {
        gameState.teacherDirectionX *= -1;
    }
    if (gameState.teacherY <= 50 || gameState.teacherY >= CONFIG.gameHeight - 100) {
        gameState.teacherDirectionY *= -1;
    }

    // Occasionally move toward player (makes it more challenging)
    if (Math.random() < 0.02) {
        if (gameState.playerX > gameState.teacherX) {
            gameState.teacherDirectionX = 1;
        } else {
            gameState.teacherDirectionX = -1;
        }
        if (gameState.playerY > gameState.teacherY) {
            gameState.teacherDirectionY = 1;
        } else {
            gameState.teacherDirectionY = -1;
        }
    }

    // Update teacher element position
    elements.teacher.style.left = gameState.teacherX + 'px';
    elements.teacher.style.top = gameState.teacherY + 'px';
}

// ========================================
// Collision Detection
// ========================================

/**
 * Checks if two rectangles are colliding
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {boolean} True if rectangles are colliding
 */
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Checks all game collisions (items and teacher)
 */
function checkCollisions() {
    const playerRect = {
        x: gameState.playerX,
        y: gameState.playerY,
        width: 40,
        height: 50
    };

    // Check collision with teacher
    const teacherRect = {
        x: gameState.teacherX,
        y: gameState.teacherY,
        width: 50,
        height: 60
    };

    if (checkCollision(playerRect, teacherRect)) {
        gameOver();
        return;
    }

    // Check collision with items
    gameState.items.forEach(item => {
        if (!item.collected && checkCollision(playerRect, item)) {
            collectItem(item);
        }
    });
}

/**
 * Handles item collection
 * @param {Object} item - The item that was collected
 */
function collectItem(item) {
    item.collected = true;
    item.element.classList.add('collected');
    
    // Remove element after animation
    setTimeout(() => {
        item.element.remove();
    }, 300);

    // Update score
    gameState.score++;
    elements.score.textContent = gameState.score;

    // Check for win condition
    if (gameState.score >= gameState.totalItems) {
        winGame();
    }
}

// ========================================
// Game Loop
// ========================================

/**
 * Main game loop - runs every frame
 */
function gameLoop() {
    if (!gameState.isRunning) return;

    updatePlayerPosition();
    updateTeacherPosition();
    checkCollisions();

    // Continue the loop
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// ========================================
// Game State Functions
// ========================================

/**
 * Starts a new game
 */
function startGame() {
    // Reset game state
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.playerX = 400;
    gameState.playerY = 400;
    gameState.teacherX = 200;
    gameState.teacherY = 150;
    gameState.teacherDirectionX = 1;
    gameState.teacherDirectionY = 1;
    gameState.keysPressed = {};

    // Update UI
    elements.score.textContent = '0';
    elements.totalItems.textContent = CONFIG.itemCount;
    
    // Position player and teacher
    elements.player.style.left = gameState.playerX + 'px';
    elements.player.style.top = gameState.playerY + 'px';
    elements.teacher.style.left = gameState.teacherX + 'px';
    elements.teacher.style.top = gameState.teacherY + 'px';

    // Create items
    createItems();

    // Show game screen
    showScreen('game');

    // Add snow effect
    createSnowflakes();

    // Start game loop
    gameLoop();
}

/**
 * Ends the game (player caught by teacher)
 */
function gameOver() {
    gameState.isRunning = false;
    cancelAnimationFrame(gameState.animationId);
    
    elements.finalScore.textContent = gameState.score;
    showScreen('gameOver');
}

/**
 * Player wins the game
 */
function winGame() {
    gameState.isRunning = false;
    cancelAnimationFrame(gameState.animationId);
    
    showScreen('win');
}

// ========================================
// Visual Effects
// ========================================

/**
 * Creates falling snowflake effect
 */
function createSnowflakes() {
    // Remove existing snowflakes
    document.querySelectorAll('.snowflake').forEach(sf => sf.remove());

    // Create new snowflakes
    for (let i = 0; i < 15; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.left = Math.random() * CONFIG.gameWidth + 'px';
        snowflake.style.animationDuration = (3 + Math.random() * 4) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        elements.gameContainer.appendChild(snowflake);
    }
}

// ========================================
// Event Listeners
// ========================================

// Keyboard controls
document.addEventListener('keydown', (e) => {
    gameState.keysPressed[e.code] = true;
    
    // Prevent scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keysPressed[e.code] = false;
});

// Button event listeners
buttons.start.addEventListener('click', startGame);
buttons.retry.addEventListener('click', startGame);
buttons.playAgain.addEventListener('click', startGame);

// ========================================
// Initialize Game
// ========================================

// Show start screen when page loads
showScreen('start');

console.log('🍪 Christmas Cookie Adventure loaded! Press Start to play.');

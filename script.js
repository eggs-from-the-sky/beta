// #region wrapper scaling

function scaleGame() {
    const wrappers = document.querySelectorAll('.wrapper');
    const scaleX = window.innerWidth / 1920;
    const scaleY = window.innerHeight / 1080;
    const scale = Math.min(scaleX, scaleY);

    wrappers.forEach(wrapper => {
        wrapper.style.transform = `scale(${scale}) translate(-50%, -50%) `; 
    });
}
window.addEventListener('resize', scaleGame);

scaleGame();

// #endregion

// #region music

const musicFiles = [
    "music/candyland.mp3",
    "music/amnis&wildgaves&tomplatts-remix.mp3",
    "music/dj-spyroof-remix.mp3",
    "music/dr.l&j.woods-remix.mp3",
    "music/joey-lamecker-remix.mp3",
    "music/just-isac-remix.mp3",
    "music/kajacks-remix.mp3",
    "music/mo-falk-remix.mp3",
    "music/musicbysergius-remix.mp3",
    "music/new-city-lights-remix.mp3",
    "music/roslaen-remix.mp3",
    "music/seffy-remix.mp3",
    "music/slycer-remix.mp3",
    "music/zach-remix.mp3",
    "music/zushi&vanko-remix.mp3"
];

const audio = document.querySelector('audio');

let lastTrackIndex = -1;

function playRandomTrack() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * musicFiles.length);
    } while (randomIndex === lastTrackIndex);
    lastTrackIndex = randomIndex;
    audio.src = musicFiles[randomIndex];
    audio.play();
}
audio.addEventListener('ended', playRandomTrack);

window.addEventListener('click', () => {
    playRandomTrack();
}, {
    once: true
});

window.addEventListener('touchstart', () => {
    playRandomTrack();
}, {
    once: true
});

window.addEventListener('click', () => {
    document.body.requestFullscreen();
});

window.addEventListener('touchstart', () => {
    document.body.requestFullscreen();
});

// #endregion

// #region canvas setup

// initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const collisionCanvas = document.getElementById('collisionCanvas');
const cctx = collisionCanvas.getContext('2d');

let scaleFactor = 1;
let width = canvas.width;
let height = canvas.height;

// resize canvas to window size
function resizeCanvas() {
    const vWidth = window.innerWidth;
    const vHeight = window.innerHeight;

    // maintain 16:9 aspect ratio
    if (vWidth / vHeight > 16 / 9) {
        canvas.width = vHeight * (16 / 9);
        canvas.height = vHeight;
    } else {
        canvas.width = vWidth;
        canvas.height = vWidth * (9 / 16);
    }

    width = canvas.width;
    height = canvas.height;

    // calculate scale factor based on original size (1920x1080)
    scaleFactor = canvas.width / 1920;
    ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0); // scale the context
}

window.addEventListener('resize', resizeCanvas);

resizeCanvas(); // initial resize

// #endregion

// #region variables

// logic variables

let lastTime = 0;
let deltaTime = 0;

let gameOver = false;
let gameScene = "game";
let gamePaused = false;

let score = 0;

let eggs = [];
let eggSpawnTimer = 0;

// game variables

// ball properties
const ballWidth = 150;
const ballHeight = 150;

const ballMaxSpeed = 1000;
const ballAcceleration = 10000;

let ballSpeed = 0;
let ballX = 960;
const ballY = 1080 - (ballHeight / 2) - 200;

let ballDeathStart = 0;        // timestamp when death animation starts
let ballDeathDuration = 1000;  // duration of death scaling (ms)
let ballScale = 1;             // current scale
let ballAlpha = 1;             // current opacity of the ball


const ballFriction = 0.01;
const ballFrictionMultipler = 3;

// egg properties
const eggWidth = 150;
const eggHeight = 185;

const eggSpawnInterval = 150;
const eggFallSpeed = 800;
const eggSpinSpeed = 60;

// #endregion

// #region input handling

const keys = {
    a: false,
    d: false,
    left: false,
    right: false,
};

// check for key presses
document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
});

// list of active touches
const activeTouches = new Set();

document.addEventListener('touchstart', (e) => {
    for (let touch of e.changedTouches) {
        if (touch.clientX < window.innerWidth / 2) {
            activeTouches.add('left');
        } else {
            activeTouches.add('right');
        }
    }
});

document.addEventListener('touchend', (e) => {
    for (let touch of e.changedTouches) {
        if (touch.clientX < window.innerWidth / 2) {
            activeTouches.delete('left');
        } else {
            activeTouches.delete('right');
        }
    }
});

// #endregion

// #region game logic

// update ball position and speed
function updateBall(deltaTime) {
    // handle input

    let leftActive = keys.a || keys.left || activeTouches.has('left');
    let rightActive = keys.d || keys.right || activeTouches.has('right');

    if (!gameOver) {
        if (leftActive) {
            ballSpeed -= ballAcceleration * (deltaTime / 1000);
        }
        if (rightActive) {
            ballSpeed += ballAcceleration * (deltaTime / 1000);
        }
    }

    // apply friction
    if (gameOver) {
        ballSpeed *= Math.pow(ballFriction, (deltaTime / 1000) * ballFrictionMultipler / 2);
    } else if (leftActive == rightActive) {
        ballSpeed *= Math.pow(ballFriction, (deltaTime / 1000) * ballFrictionMultipler);
    }

    // clamp speed
    if (ballSpeed > ballMaxSpeed) ballSpeed = ballMaxSpeed;
    if (ballSpeed < -ballMaxSpeed) ballSpeed = -ballMaxSpeed;

    // update position
    ballX += ballSpeed * (deltaTime / 1000);

    // clamp position
    if (ballX < ballWidth / 2) {
        ballX = ballWidth / 2;
        ballSpeed = 0;
    }
    if (ballX > 1920 - (ballWidth / 2)) {
        ballX = 1920 - (ballWidth / 2);
        ballSpeed = 0;
    }
}

// spawn an egg
function addEgg() {
    // calculate egg position and rotation
    let x;
    do {
        x = Math.random() * ((1920 - (eggWidth)) + (eggWidth / 2));
        recentEggs = eggs.slice(-1);
    } while (recentEggs.some(e => Math.abs(e.x - x) < 200));

    const egg = {
        x: x,
        y: -eggHeight,
        angle: Math.random() * 360,
    };

    // add egg to array
    eggs.push(egg);
}

function updateEggs(deltaTime) {
    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];

        // update position and rotation
        egg.y += eggFallSpeed * (deltaTime / 1000);
        egg.angle += eggSpinSpeed * (deltaTime / 1000);
        if (egg.angle >= 360) egg.angle -= 360;

        // remove egg if it falls off screen
        if (egg.y > 880 + eggHeight) {

            if (!gameOver) {score++;}
            eggs.splice(i, 1);
            continue;
        }
    }
}

// collision detection
function getNearbyEggs() {
    return eggs.filter(egg => {
        const dx = egg.x - ballX;
        const dy = egg.y - ballY;
        return Math.sqrt(dx*dx + dy*dy) < 75 + 75;
    });
}

function renderCollisionRegion(nearbyEggs) {
    cctx.clearRect(0, 0, 150, 150);
    cctx.save();
    cctx.translate(-ballX + 75, -ballY + 75);

    nearbyEggs.forEach(egg => {
        cctx.drawImage(eggCollision, egg.x - 60, egg.y - 75);
    });

    cctx.restore();
}

function checkCollisions() {
    const imgData = cctx.getImageData(0, 0, 150, 150).data;
    for (let y = -75; y < 75; y++) {
        for (let x = -75; x < 75; x++) {
            if (x*x + y*y <= 75*75) { // inside ball
                const px = 75 + x;
                const py = 75 + y;
                const idx = (py * 150 + px) * 4;
                
                // bounds check
                if (px < 0 || px >= 150 || py < 0 || py >= 150) continue;

                if (imgData[idx + 3] > 0) return true; // collision
            }
        }
    }
    return false; // no collision
}

function detectCollision() {
    const nearbyEggs = getNearbyEggs();
    if (nearbyEggs.length === 0) return false;

    renderCollisionRegion(nearbyEggs);
    return checkCollisions();
}

function resetGame() {
    gameOver = false;
    score = 0;
    eggs = [];
    eggSpawnTimer = 0;
    ballX = 960;
    ballSpeed = 0;
}

// cubic-bezier easing function
function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    function bezier(t, a, b, c) {
        return ((a * t + b) * t + c) * t;
    }

    function getTforX(x) {
        let t = x;
        for (let i = 0; i < 5; i++) {
            const f = bezier(t, ax, bx, cx) - x;
            const df = 3 * ax * t * t + 2 * bx * t + cx;
            if (df === 0) break;
            t -= f / df;
        }
        return t;
    }

    return function(x) {
        const t = getTforX(x);
        return bezier(t, ay, by, cy);
    };
}

// cubic-bezier(0, 0.5, 0.5, 1)
const ballDeathEase = cubicBezier(0.2, 0.8, 0.2, 0.8);


// #endregion

// #region game loop

const ballTexture = new Image();
ballTexture.src = 'textures/blue.svg';

const eggTexture = new Image();
eggTexture.src = 'textures/egg.svg';

const eggCollision = new Image();
eggCollision.src = 'textures/egg-collision.svg';

const backgroundTexture = new Image();
backgroundTexture.src = 'textures/background.svg';

const groundTexture = new Image();
groundTexture.src = 'textures/ground.svg';

function gameLoop(timestamp) {
    if (gameOver && ballDeathStart) {
        const elapsed = lastTime - ballDeathStart;
        let t = elapsed / ballDeathDuration;
    if (t > 1) t = 1;
        ballScale = 1 + ballDeathEase(t); // scale from 1 → 0
        ballAlpha = 1 - ballDeathEase(t);
    } else {
        ballScale = 1;
        ballAlpha = 1;
    }


    if (!lastTime) lastTime = timestamp;
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!gamePaused && gameScene == "game") {
        updateBall(deltaTime);
    }

    if (!gamePaused && gameScene == "game") {
        eggSpawnTimer += deltaTime;
        if (eggSpawnTimer >= eggSpawnInterval) {
            addEgg();
            eggSpawnTimer = 0;
        }

        updateEggs(deltaTime);
    }

    

    // clear canvas
    ctx.clearRect(0, 0, width / scaleFactor, height / scaleFactor);

    // draw game shadows
    if (gameScene === "game") {
        // draw ball
        if (!gameOver) {
        ctx.save();
        ctx.translate(ballX, ballY)
        ctx.scale(ballScale, ballScale);
        ctx.globalAlpha = ballAlpha;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 20 * scaleFactor;
        ctx.shadowOffsetY = 20 * scaleFactor;
        ctx.drawImage(
            ballTexture,
            -ballWidth / 2,                    // offset by half width
            -ballHeight / 2,                   // offset by half height
            ballWidth,
            ballHeight
        );
        ctx.restore();
        }

        // draw eggs
        eggs.forEach(egg => {
            ctx.save();
            ctx.translate(egg.x, egg.y);
            ctx.rotate(egg.angle * Math.PI / 180);
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 20 * scaleFactor;
            ctx.shadowOffsetY = 20 * scaleFactor;
            ctx.drawImage(eggTexture, -eggWidth / 2, -eggHeight / 2, eggWidth, eggHeight);
            ctx.restore();
        });

        // draw ground
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20 * scaleFactor;
        ctx.drawImage(groundTexture, 0, 0, 1920, 1080);
        ctx.restore();
    }
    
    // draw game objects
    if (gameScene === "game") {
        // draw ball
        ctx.save();
        ctx.translate(ballX, ballY);          // move origin to ball center
        ctx.scale(ballScale, ballScale);      // scale around the center
        ctx.globalAlpha = ballAlpha;  
        ctx.drawImage(
            ballTexture,
            -ballWidth / 2,                    // offset by half width
            -ballHeight / 2,                   // offset by half height
            ballWidth,
            ballHeight
        );
        ctx.restore();


        // draw eggs
        eggs.forEach(egg => {
            ctx.save();
            ctx.translate(egg.x, egg.y);
            ctx.rotate(egg.angle * Math.PI / 180);;
            ctx.drawImage(eggTexture, -eggWidth / 2, -eggHeight / 2, eggWidth, eggHeight);
            ctx.restore();
        });

        // draw ground
        ctx.save();
        ctx.drawImage(groundTexture, 0, 0, 1920, 1080);
        ctx.restore();

        document.getElementById('score').textContent = score;

        if (detectCollision() && !gameOver) {
            gameOver = true;
            ballDeathStart = performance.now();
            setTimeout(resetGame, 1000);
        }
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// #endregion

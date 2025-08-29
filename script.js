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

// #endregion

// #region canvas setup

// initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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

const ballFriction = 0.01;
const ballFrictionMultipler = 3;

// egg properties
const eggWidth = 150;
const eggHeight = 185;

const eggSpawnInterval = 125;
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
    const leftActive = keys.a || keys.left || activeTouches.has('left');
    const rightActive = keys.d || keys.right || activeTouches.has('right');

    if (leftActive) {
        ballSpeed -= ballAcceleration * (deltaTime / 1000);
    }
    if (rightActive) {
        ballSpeed += ballAcceleration * (deltaTime / 1000);
    }
    // apply friction
    if (leftActive == rightActive) {
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
            score++;
            eggs.splice(i, 1);
            continue;
        }
    }
}

// #endregion

// #region game loop

const ballTexture = new Image();
ballTexture.src = 'textures/blue.svg';

const eggTexture = new Image();
eggTexture.src = 'textures/egg.svg';

const backgroundTexture = new Image();
backgroundTexture.src = 'textures/background.svg';

const groundTexture = new Image();
groundTexture.src = 'textures/ground.svg';

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (!gamePaused && gameScene == "game" && !gameOver) {
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
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 20 * scaleFactor;
        ctx.shadowOffsetY = 20 * scaleFactor;
        ctx.drawImage(ballTexture, ballX - ballWidth / 2, ballY - ballHeight / 2, ballWidth, ballHeight);
        ctx.restore();

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
        ctx.shadowBlur = 30 * scaleFactor;
        ctx.drawImage(groundTexture, 0, 0, 1920, 1080);
        ctx.restore();
    }
    
    // draw game objects
    if (gameScene === "game") {
        // draw ball
        ctx.save();
        ctx.drawImage(ballTexture, ballX - ballWidth / 2, ballY - ballHeight / 2, ballWidth, ballHeight);
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
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// #endregion

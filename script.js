function scaleGame() {
    const game = document.querySelector('.game');
    const wrapper = document.querySelector('.wrapper');
    const blackBars = document.querySelector('.black-bars');
    const scaleX = window.innerWidth / 1919;
    const scaleY = window.innerHeight / 1079;
    const scale = Math.min(scaleX, scaleY);
    wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const barsScaleX = window.innerWidth / 1919;
    const barsScaleY = window.innerHeight / 1079;
    const barsScale = Math.min(barsScaleX, barsScaleY);
    blackBars.style.transform = `translate(-50%, -50%) scale(${barsScale})`;
}
window.addEventListener('resize', scaleGame);
window.addEventListener('DOMContentLoaded', scaleGame);

function goFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

document.body.addEventListener('click', () => {
    goFullscreen();
});

document.body.addEventListener('touchstart', () => {
    goFullscreen();
});

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
    } while (musicFiles.length > 1 && randomIndex === lastTrackIndex);
    lastTrackIndex = randomIndex;
    audio.src = musicFiles[randomIndex];
    audio.load();
    audio.play();
}

audio.addEventListener('ended', playRandomTrack);

document.body.addEventListener('click', function() {
    playRandomTrack();
}, { once: true });

document.body.addEventListener('touchstart', function() {
    playRandomTrack();
}, { once: true });

let score = 0;
const scoreElement = document.getElementById('score');

const player = document.getElementById('player');
let playerX = 960;
let playerVel = 0;
const playerWidth = 150;
const gameWidth = 1920;
const moveSpeed = 10000;
const maxSpeed = 1000;
const friction = 0.01;

function updatePlayerPosition() {
    player.style.left = `${playerX - playerWidth / 2}px`;
}

const keys = {
  a: false,
  d: false,
  left: false,
  right: false,
};

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
document.addEventListener('touchend', (e) => {
    keys.a = false;
    keys.d = false;
});

let lastTime = performance.now();

let gameOver = false;

const eggWidth = 150;
const eggHeight = 185;
const eggFallSpeed = 800;
const eggSpinSpeed = 60;

let eggs = [];

const minSpacing = 200;

function addEgg() {
    const egg = document.createElement('div');
    egg.className = 'egg';

    let x;
    do {
        x = Math.random() * ((gameWidth - (eggWidth * 2) + eggWidth));

        recentEggs = eggs.slice(-1);
    } while (recentEggs.some(e => Math.abs(parseFloat(e.dataset.x) - x) < minSpacing));


    egg.dataset.x = x;
    egg.dataset.y = -eggHeight;
    egg.dataset.angle = Math.random() * 360;
    document.querySelector('.game').appendChild(egg);
    eggs.push(egg);
}

setInterval(addEgg, 125);

function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
}

function updateEggs(delta) {
    const playerRadius = playerWidth / 2;
    const playerCenterX = playerX + (playerRadius / 2);
    const playerCenterY = 1080 - 200 - (playerRadius / 2);

    for (let i = eggs.length - 1; i >= 0; i--) {
        const egg = eggs[i];
        let x = parseFloat(egg.dataset.x);
        let y = parseFloat(egg.dataset.y);
        let angle = parseFloat(egg.dataset.angle);

        y += eggFallSpeed * delta;
        angle += eggSpinSpeed * delta;

        egg.dataset.y = y;
        egg.dataset.angle = angle;
        egg.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

        const eggRadius = 50;
        const eggCenterX = x + eggWidth / 2;
        const eggCenterY = y + eggHeight / 2;

        if (circleCollision(playerCenterX, playerCenterY, playerRadius, eggCenterX, eggCenterY, eggRadius)) {
            if (gameOver) continue;
            gameOver = true;
            player.classList.add('dead');

            setTimeout(() => {
                player.classList.remove('dead');
                playerX = 960;
                playerVel = 0;
                score = 0;
                scoreElement.textContent = score;
                gameOver = false;
                eggs.forEach(egg => egg.remove());
                eggs = [];
            }, 1000);
                    continue;
                }

        if (y > 880) {
            egg.remove();
            eggs.splice(i, 1);
            if (gameOver) continue;
            score++;
            scoreElement.textContent = score;
        }
    }
}

function gameLoop(now = performance.now()) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    const leftActive  = keys.a || keys.left || activeTouches.has('left');
    const rightActive = keys.d || keys.right || activeTouches.has('right');

    if (leftActive) playerVel -= moveSpeed * delta;
    if (rightActive) playerVel += moveSpeed * delta;

    if (playerVel > maxSpeed) playerVel = maxSpeed;
    if (playerVel < -maxSpeed) playerVel = -maxSpeed;

    if (leftActive == rightActive) {
        const frictionFactor = Math.pow(friction, delta * 3);
        playerVel *= frictionFactor;

        if (Math.abs(playerVel) < 0.01) playerVel = 0;
    }

    if (!gameOver) {playerX += playerVel * delta;}
    playerX = Math.max(playerWidth / 2, Math.min(gameWidth - (playerWidth / 2), playerX));

    updateEggs(delta);

    updatePlayerPosition();
    requestAnimationFrame(gameLoop);
}

gameLoop();

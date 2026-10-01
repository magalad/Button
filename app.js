const questionPanel = document.querySelector("#questionPanel");
const successPanel = document.querySelector("#successPanel");
const choiceField = document.querySelector("#choiceField");
const yesButton = document.querySelector("#yesButton");
const noButton = document.querySelector("#noButton");
const surpriseButton = document.querySelector("#surpriseButton");
const replayButton = document.querySelector("#replayButton");
const statusLine = document.querySelector("#statusLine");
const surpriseMessage = document.querySelector("#surpriseMessage");
const ambientCanvas = document.querySelector("#ambientCanvas");
const confettiCanvas = document.querySelector("#confettiCanvas");

const statusMessages = [
  "The dance floor respectfully rejects No.",
  "No has lost rhythm.",
  "The party committee recommends Yes.",
  "No stepped on its own shoes.",
  "Interesting. The music says otherwise.",
  "That option has left the ballroom.",
  "Yes is looking very elegant right now.",
  "No is now decorative.",
  "The correct answer is getting larger."
];

const noLabels = [
  "No",
  "Nope",
  "Try again",
  "Too late",
  "Off beat",
  "Maybe yes",
  "Almost yes",
  "Yes?"
];

const minNoScale = 0.34;
const maxYesScale = 1.72;
const noShrinkStep = 0.075;
const yesGrowStep = 0.085;

let noAttempts = 0;
let confettiPieces = [];
let confettiAnimation = null;
let ambientShapes = [];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function intersects(a, b) {
  return !(
    a.left > b.right ||
    a.right < b.left ||
    a.top > b.bottom ||
    a.bottom < b.top
  );
}

function scaledButtonBox(x, y, button, scale) {
  const width = button.offsetWidth * scale;
  const height = button.offsetHeight * scale;
  const widthOffset = (width - button.offsetWidth) / 2;
  const heightOffset = (height - button.offsetHeight) / 2;

  return {
    left: x - widthOffset,
    right: x + button.offsetWidth + widthOffset,
    top: y - heightOffset,
    bottom: y + button.offsetHeight + heightOffset
  };
}

function getButtonScales() {
  return {
    noScale: Math.max(minNoScale, 1 - noAttempts * noShrinkStep),
    yesScale: Math.min(maxYesScale, 1 + noAttempts * yesGrowStep)
  };
}

function moveNoButton() {
  const padding = 10;
  const { noScale, yesScale } = getButtonScales();
  const scaledNoWidth = noButton.offsetWidth * noScale;
  const scaledNoHeight = noButton.offsetHeight * noScale;
  const maxX = Math.max(padding, choiceField.clientWidth - scaledNoWidth - padding);
  const maxY = Math.max(padding, choiceField.clientHeight - scaledNoHeight - padding);
  const yesBox = scaledButtonBox(yesButton.offsetLeft, yesButton.offsetTop, yesButton, yesScale);
  let nextX = padding;
  let nextY = padding;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidateX = randomBetween(padding, maxX);
    const candidateY = randomBetween(padding, maxY);
    const candidateBox = scaledButtonBox(candidateX, candidateY, noButton, noScale);

    if (!intersects(candidateBox, yesBox)) {
      nextX = candidateX;
      nextY = candidateY;
      break;
    }
  }

  const rotation = randomBetween(-9, 9).toFixed(2);
  noButton.style.left = `${nextX}px`;
  noButton.style.top = `${nextY}px`;
  noButton.style.setProperty("--no-scale", noScale.toFixed(2));
  noButton.style.setProperty("--no-rotate", `${rotation}deg`);
  yesButton.style.setProperty("--yes-scale", yesScale.toFixed(2));
}

function updateNoCopy() {
  const messageIndex = Math.min(noAttempts - 1, statusMessages.length - 1);
  const labelIndex = Math.min(noAttempts, noLabels.length - 1);
  statusLine.textContent = statusMessages[messageIndex];
  noButton.textContent = noLabels[labelIndex];
}

function dodgeNoButton(event) {
  if (document.body.dataset.state === "success") {
    return;
  }

  if (event.type !== "pointerenter") {
    event.preventDefault();
  }

  noAttempts += 1;
  updateNoCopy();
  moveNoButton();
}

function resetExperience() {
  document.body.dataset.state = "asking";
  noAttempts = 0;
  noButton.textContent = "No";
  statusLine.textContent = "Choose wisely.";
  surpriseMessage.hidden = true;
  surpriseButton.hidden = false;
  noButton.style.setProperty("--no-scale", "1");
  noButton.style.setProperty("--no-rotate", "0deg");
  yesButton.style.setProperty("--yes-scale", "1");
  questionPanel.hidden = false;
  successPanel.hidden = true;
  window.requestAnimationFrame(moveNoButton);
  yesButton.focus({ preventScroll: true });
}

function celebrate() {
  document.body.dataset.state = "success";
  questionPanel.hidden = true;
  successPanel.hidden = false;
  surpriseMessage.hidden = true;
  surpriseButton.hidden = false;
  successPanel.focus({ preventScroll: true });
  surpriseButton.focus({ preventScroll: true });
  launchConfetti(220);
}

function openSurprise() {
  surpriseButton.hidden = true;
  surpriseMessage.hidden = false;
  surpriseMessage.focus({ preventScroll: true });
  launchConfetti(300);
}

function resizeCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

function drawSparkle(context, x, y, size, color) {
  context.save();
  context.translate(x, y);
  context.beginPath();
  context.moveTo(0, -size);
  context.lineTo(size * 0.28, -size * 0.28);
  context.lineTo(size, 0);
  context.lineTo(size * 0.28, size * 0.28);
  context.lineTo(0, size);
  context.lineTo(-size * 0.28, size * 0.28);
  context.lineTo(-size, 0);
  context.lineTo(-size * 0.28, -size * 0.28);
  context.closePath();
  context.fillStyle = color;
  context.fill();
  context.restore();
}

function createAmbientShapes() {
  const palette = ["#ffd166", "#54d6c2", "#ff6b9a", "#7aa7ff", "#fffaf0"];
  const snippets = ["dance()", "22 years", "party.now()", "sayYes()", "sparkle++"];
  const total = window.innerWidth < 720 ? 20 : 36;

  ambientShapes = Array.from({ length: total }, (_, index) => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speed: randomBetween(0.16, 0.48),
    drift: randomBetween(-0.2, 0.2),
    size: randomBetween(12, 30),
    color: palette[index % palette.length],
    text: snippets[index % snippets.length],
    kind: index % 3 === 0 ? "sparkle" : index % 3 === 1 ? "dot" : "code",
    opacity: randomBetween(0.22, 0.56)
  }));
}

function drawAmbient() {
  const context = resizeCanvas(ambientCanvas);
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ambientShapes.forEach((shape) => {
    shape.y -= shape.speed;
    shape.x += shape.drift;

    if (shape.y < -70) {
      shape.y = window.innerHeight + 70;
      shape.x = Math.random() * window.innerWidth;
    }

    if (shape.x < -90) {
      shape.x = window.innerWidth + 90;
    } else if (shape.x > window.innerWidth + 90) {
      shape.x = -90;
    }

    context.globalAlpha = shape.opacity;

    if (shape.kind === "sparkle") {
      drawSparkle(context, shape.x, shape.y, shape.size * 0.52, shape.color);
    } else if (shape.kind === "dot") {
      context.beginPath();
      context.arc(shape.x, shape.y, shape.size * 0.24, 0, Math.PI * 2);
      context.fillStyle = shape.color;
      context.fill();
    } else {
      context.save();
      context.translate(shape.x, shape.y);
      context.rotate(-0.18);
      context.font = "800 14px ui-monospace, SFMono-Regular, Consolas, monospace";
      context.fillStyle = shape.color;
      context.fillText(shape.text, 0, 0);
      context.restore();
    }

    context.globalAlpha = 1;
  });

  window.requestAnimationFrame(drawAmbient);
}

function launchConfetti(total = 220) {
  if (confettiAnimation) {
    window.cancelAnimationFrame(confettiAnimation);
  }

  const palette = ["#ffd166", "#54d6c2", "#ff6b9a", "#7aa7ff", "#fffaf0"];
  confettiPieces = Array.from({ length: total }, (_, index) => ({
    x: window.innerWidth / 2 + randomBetween(-180, 180),
    y: window.innerHeight * 0.34 + randomBetween(-80, 60),
    vx: randomBetween(-7.5, 7.5),
    vy: randomBetween(-10.8, -3.6),
    size: randomBetween(10, 22),
    rotation: randomBetween(0, Math.PI * 2),
    spin: randomBetween(-0.24, 0.24),
    color: palette[index % palette.length],
    kind: index % 4 === 0 ? "sparkle" : "rectangle",
    life: 0,
    maxLife: randomBetween(130, 220)
  }));

  animateConfetti();
}

function animateConfetti() {
  const context = resizeCanvas(confettiCanvas);
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  confettiPieces.forEach((piece) => {
    piece.life += 1;
    piece.x += piece.vx;
    piece.y += piece.vy;
    piece.vy += 0.17;
    piece.rotation += piece.spin;

    const alpha = Math.max(0, 1 - piece.life / piece.maxLife);
    context.globalAlpha = alpha;
    context.save();
    context.translate(piece.x, piece.y);
    context.rotate(piece.rotation);
    context.fillStyle = piece.color;

    if (piece.kind === "sparkle") {
      context.restore();
      drawSparkle(context, piece.x, piece.y, piece.size, piece.color);
      context.globalAlpha = alpha;
    } else {
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.72);
      context.restore();
    }
  });

  context.globalAlpha = 1;
  confettiPieces = confettiPieces.filter((piece) => piece.life < piece.maxLife);

  if (confettiPieces.length > 0) {
    confettiAnimation = window.requestAnimationFrame(animateConfetti);
  } else {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiAnimation = null;
  }
}

function handleResize() {
  resizeCanvas(ambientCanvas);
  resizeCanvas(confettiCanvas);
  createAmbientShapes();
  window.requestAnimationFrame(moveNoButton);
}

noButton.addEventListener("pointerenter", dodgeNoButton);
noButton.addEventListener("pointerdown", dodgeNoButton);
noButton.addEventListener("click", dodgeNoButton);
noButton.addEventListener("focus", dodgeNoButton);
yesButton.addEventListener("click", celebrate);
surpriseButton.addEventListener("click", openSurprise);
replayButton.addEventListener("click", resetExperience);
window.addEventListener("resize", handleResize);

document.body.dataset.state = "asking";
createAmbientShapes();
drawAmbient();
window.requestAnimationFrame(moveNoButton);

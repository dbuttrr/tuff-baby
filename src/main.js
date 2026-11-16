const stage = document.querySelector('.stage');
const wordmark = document.querySelector('.wordmark');
const fit = document.querySelector('.wordmark__fit');
const motion = document.querySelector('.wordmark__motion');
const fist = document.querySelector('.fist');
const fistShape = document.querySelector('.fist__shape');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Measure the actual font, keeping the full word inside the viewport on every screen.
function fitWordmark() {
  const width = motion.offsetWidth;
  const height = motion.offsetHeight;
  const scale = (innerWidth * 0.92) / width;
  fit.style.setProperty('--fit-x', scale);
  fit.style.setProperty('--fit-y', stage.clientHeight * 0.92 / height);
}

fitWordmark();
document.fonts.ready.then(fitWordmark);
new ResizeObserver(fitWordmark).observe(wordmark);
window.addEventListener('resize', fitWordmark);

let x = 0;
let y = 0;
let previousX = 0;
let previousY = 0;
let lastMove = 0;
let lastFrame = 0;
let targetSpeed = 0;
let energy = 0;
let direction = 0;
let hasPosition = false;
let frame = 0;

function resetMotion() {
  cancelAnimationFrame(frame);
  frame = 0;
  lastFrame = 0;
  energy = 0;
  targetSpeed = 0;
  motion.style.transform = '';
  motion.style.filter = '';
  motion.style.textShadow = '';
  fistShape.style.transform = '';
  fistShape.style.filter = '';
}

function hideCursor() {
  fist.classList.remove('is-visible');
  hasPosition = false;
  resetMotion();
}

function configurePointer() {
  document.documentElement.classList.toggle('has-fist', finePointer.matches);
  hideCursor();
}

function animate(now) {
  const delta = lastFrame ? Math.min(now - lastFrame, 50) : 16.67;
  lastFrame = now;
  // Velocity is measured in pixels/ms, then eased independently of screen refresh rate.
  if (now - lastMove > 45) targetSpeed *= Math.exp(-delta / 65);
  const targetEnergy = Math.min(targetSpeed / 2.8, 1);
  energy += (targetEnergy - energy) * (1 - Math.exp(-delta / 65));

  const shake = energy * 7;
  const jitterX = Math.sin(now * 0.095) * shake;
  const jitterY = Math.sin(now * 0.127 + 1.7) * shake * 0.55;
  const rotation = Math.sin(now * 0.071) * energy * 0.32;
  const blur = energy * 1.6;
  const smear = direction * energy * 7;

  motion.style.transform = `translate3d(${jitterX}px, ${jitterY}px, 0) rotate(${rotation}deg)`;
  motion.style.filter = `blur(${blur}px)`;
  motion.style.textShadow = `${smear}px 0 ${energy * 3}px rgb(255 255 255 / ${energy * 0.3}), ${-smear}px 0 ${energy * 3}px rgb(255 255 255 / ${energy * 0.15})`;

  // The fist stays at the pointer; only its size and wrist movement respond to speed.
  const scale = 1 + Math.pow(energy, 1.45) * 2.1;
  fistShape.style.transform = `scale(${scale}) rotate(${Math.sin(now * 0.04) * energy * 10}deg)`;
  fistShape.style.filter = `blur(${energy * 0.45}px)`;

  if (energy > 0.001 || targetSpeed > 0.001) {
    frame = requestAnimationFrame(animate);
  } else {
    resetMotion();
  }
}

window.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || event.pointerType === 'touch') return;
  const now = performance.now();
  x = event.clientX;
  y = event.clientY;
  if (hasPosition) {
    const dx = x - previousX;
    const dy = y - previousY;
    const elapsed = Math.max(now - lastMove, 8);
    targetSpeed = Math.min(Math.hypot(dx, dy) / elapsed, 6);
    if (Math.abs(dx) > 0.1) direction = Math.sign(dx);
  }
  hasPosition = true;
  previousX = x;
  previousY = y;
  lastMove = now;
  fist.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  fist.classList.add('is-visible');
  if (!reducedMotion.matches && !frame) frame = requestAnimationFrame(animate);
}, { passive: true });

document.documentElement.addEventListener('pointerleave', hideCursor);
window.addEventListener('blur', hideCursor);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hideCursor();
});
finePointer.addEventListener('change', configurePointer);
reducedMotion.addEventListener('change', resetMotion);
configurePointer();

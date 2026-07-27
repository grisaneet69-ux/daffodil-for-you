/* ==================================================================
   DAFFODIL FOR YOU — script.js
   ------------------------------------------------------------------
   ค่าที่แก้บ่อย ๆ อยู่ใน CONFIG ด้านล่าง (มีคำว่า EDIT HERE กำกับ)
   ================================================================== */

const CONFIG = {
  // EDIT HERE: ข้อความในจดหมาย (ใช้ \n ขึ้นบรรทัดใหม่)
  letterText:
`หนูไม่รู้ว่าจะจีบพี่ยังไงอ่ะ

รอบนี้จะเขียนโค้ดมาจีบละกันนะ
เดี๋ยวโชว์สกิลเด็ก ICT ให้ดู

หนูจะจีบพี่ไปเรื่อย ๆ
จนกว่าพี่จะใจอ่อนมาชอบหนู
แล้วขอหนูเป็นแฟนนะคะ

เตรียมตัวรับความรักจากหนูได้เลย

จะทำให้ดูว่าการได้รับความรักจากคนที่ใช่
มันเป็นยังไง ♡`,

  // EDIT HERE: ความเร็วในการพิมพ์ (มิลลิวินาทีต่อตัวอักษร) 35-50 แนะนำ
  typeSpeedMs: 42,

  // EDIT HERE: ระดับเสียงเพลงเริ่มต้น (0.35 - 0.45 แนะนำ)
  musicVolume: 0.4,

  // EDIT HERE: ระยะเวลาฉากทะลุมิติ (มิลลิวินาที) — ต้องตรงกับ --dur-portal ใน style.css
  portalDurationMs: 4000,

  // EDIT HERE: ข้อความหัวข้อฉากจบ
  finaleTag: 'MISSION STARTED',
  finaleMain: 'เตรียมตัวรับความรักจากหนูได้เลยนะคะ ♡',
  finaleSub: 'จีบพี่ครั้งที่ 1 — To be continued...',

  // EDIT HERE: จำนวนพลุที่ยิงตอนเริ่มฉากจบ / ความถี่ยิงซ้ำ (มิลลิวินาที)
  fireworksInitialBursts: 6,
  fireworksRepeatIntervalMs: 1600,

  // EDIT HERE: ความถี่การเกิดกลีบดอกไม้ (มิลลิวินาทีต่อกลีบ)
  petalSpawnIntervalMs: 420,

  // ไฟล์ภาพพื้นหลังสวน (วางไฟล์ garden.jpg หรือ garden.png ไว้โฟลเดอร์เดียวกับ index.html)
  gardenImageCandidates: ['garden.jpg', 'garden.png']
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------
   ตัวแปรอ้างอิงแต่ละ Screen / Element
   ------------------------------------------------------------------ */
const screenIntro = document.getElementById('screen-intro');
const screenPortal = document.getElementById('screen-portal');
const screenGarden = document.getElementById('screen-garden');
const screenFinale = document.getElementById('screen-finale');

const readyBtn = document.getElementById('readyBtn');
const portalFlash = document.getElementById('portalFlash');
const portalParticles = document.getElementById('portalParticles');

const gardenBg = document.getElementById('gardenBg');
const petalsLayer = document.getElementById('petalsLayer');
const bouquetBtn = document.getElementById('bouquetBtn');
const envelopeBtn = document.getElementById('envelopeBtn');

const letterModal = document.getElementById('letterModal');
const letterModalBg = document.getElementById('letterModalBg');
const letterText = document.getElementById('letterText');
const typeCursor = document.getElementById('typeCursor');
const closeLetterBtn = document.getElementById('closeLetterBtn');

const finaleTextEl = document.querySelector('.finale-text');
const finaleTag = document.getElementById('finaleTag');
const finaleMain = document.getElementById('finaleMain');
const finaleSub = document.getElementById('finaleSub');
const fireworksCanvas = document.getElementById('fireworksCanvas');

const bgMusic = document.getElementById('bgMusic');
const soundToggle = document.getElementById('soundToggle');
const soundIcon = document.getElementById('soundIcon');

let readyPressed = false;
let envelopeOpened = false;
let letterFinishedTyping = false;
let petalIntervalId = null;

/* ------------------------------------------------------------------
   ฟังก์ชันเปลี่ยนฉาก
   ------------------------------------------------------------------ */
function showScreen(screenEl) {
  [screenIntro, screenPortal, screenGarden, screenFinale].forEach(s => {
    s.classList.remove('active-screen');
    s.classList.add('hidden-screen');
    s.setAttribute('aria-hidden', 'true');
  });
  screenEl.classList.remove('hidden-screen');
  screenEl.classList.add('active-screen');
  screenEl.setAttribute('aria-hidden', 'false');
}

/* ------------------------------------------------------------------
   ฟังก์ชันเริ่มเพลง / เปิดปิดเสียง
   ------------------------------------------------------------------ */
function startMusic() {
  bgMusic.volume = CONFIG.musicVolume;
  const playPromise = bgMusic.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(() => {
      // ถ้าเล่นไม่ได้ (ไฟล์ไม่มี หรือถูกเบราว์เซอร์บล็อก) ให้เว็บทำงานต่อได้ตามปกติ
      console.log('เพลงยังไม่พร้อมเล่น หรือไม่พบไฟล์ song.mp3');
    });
  }
  soundToggle.hidden = false;
}

function toggleSound() {
  if (bgMusic.muted) {
    bgMusic.muted = false;
    soundIcon.textContent = '🔊';
  } else {
    bgMusic.muted = true;
    soundIcon.textContent = '🔈';
  }
}

soundToggle.addEventListener('click', toggleSound);

/* ------------------------------------------------------------------
   ฟังก์ชันสร้างกลีบดอกไม้ลอยในฉากสวน
   ------------------------------------------------------------------ */
function spawnPetal() {
  const petal = document.createElement('div');
  petal.className = 'petal';
  const size = 6 + Math.random() * 8;
  petal.style.width = `${size}px`;
  petal.style.height = `${size}px`;
  petal.style.left = `${Math.random() * 100}%`;
  const duration = 6 + Math.random() * 5;
  petal.style.animationDuration = `${duration}s`;
  petalsLayer.appendChild(petal);

  // ลบกลีบดอกไม้เมื่อ Animation จบ เพื่อไม่ให้ Element เพิ่มขึ้นเรื่อย ๆ
  setTimeout(() => petal.remove(), duration * 1000 + 200);
}

function startPetals() {
  if (reducedMotion) return; // ลดการเคลื่อนไหวถ้าผู้ใช้ตั้งค่าไว้
  if (petalIntervalId) return;
  petalIntervalId = setInterval(spawnPetal, CONFIG.petalSpawnIntervalMs);
}

/* ------------------------------------------------------------------
   ฟังก์ชันโหลดภาพพื้นหลังสวน (garden.jpg / garden.png) แบบมี fallback
   ------------------------------------------------------------------ */
function loadGardenBackground() {
  let i = 0;
  function tryNext() {
    if (i >= CONFIG.gardenImageCandidates.length) return; // ไม่มีไฟล์ภาพ -> ใช้ CSS gradient สำรอง (ตั้งไว้แล้วใน style.css)
    const src = CONFIG.gardenImageCandidates[i];
    const img = new Image();
    img.onload = () => { gardenBg.style.backgroundImage = `url('${src}')`; };
    img.onerror = () => { i++; tryNext(); };
    img.src = src;
  }
  tryNext();
}

/* ------------------------------------------------------------------
   ฟังก์ชันสร้างอนุภาคพุ่งเข้าหาผู้ชมตอนทะลุมิติ
   ------------------------------------------------------------------ */
function spawnPortalParticles() {
  if (reducedMotion) return;
  const count = 40;
  for (let n = 0; n < count; n++) {
    const p = document.createElement('div');
    p.className = 'portal-particle';
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 55; // vmin
    const delay = Math.random() * 1.2;
    const dur = 1.4 + Math.random() * 1.6;
    p.style.setProperty('--tx', `${Math.cos(angle) * distance}vmin`);
    p.style.setProperty('--ty', `${Math.sin(angle) * distance}vmin`);
    p.style.animation = `portalShoot ${dur}s ease-in ${delay}s forwards`;
    portalParticles.appendChild(p);
  }
}

// เพิ่ม keyframes สำหรับอนุภาคแบบ dynamic (ใช้ตัวแปร CSS --tx --ty)
const dynamicStyle = document.createElement('style');
dynamicStyle.textContent = `
@keyframes portalShoot {
  0% { transform: translate(-50%,-50%) translate(0,0) scale(0.3); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translate(-50%,-50%) translate(var(--tx), var(--ty)) scale(1); opacity: 0; }
}`;
document.head.appendChild(dynamicStyle);

/* ------------------------------------------------------------------
   ลำดับเหตุการณ์: กด READY -> ทะลุมิติ -> สวน
   ------------------------------------------------------------------ */
readyBtn.addEventListener('click', () => {
  if (readyPressed) return; // ป้องกันการกดซ้ำ
  readyPressed = true;
  readyBtn.setAttribute('aria-disabled', 'true');

  startMusic();
  spawnPortalParticles();
  showScreen(screenPortal);

  setTimeout(() => {
    portalFlash.classList.add('flash-active');
  }, CONFIG.portalDurationMs - 500);

  setTimeout(() => {
    showScreen(screenGarden);
    loadGardenBackground();
    startPetals();
  }, CONFIG.portalDurationMs);
});

/* ------------------------------------------------------------------
   ฟังก์ชันเปิดจดหมาย + พิมพ์ทีละตัว
   ------------------------------------------------------------------ */
function openLetter() {
  if (envelopeOpened) return; // ป้องกันเปิดซ้ำ
  envelopeOpened = true;
  letterModal.classList.add('modal-active');
  letterModal.setAttribute('aria-hidden', 'false');
  typeLetter();
}

function typeLetter() {
  const fullText = CONFIG.letterText;
  let index = 0;

  if (reducedMotion) {
    // ลดการเคลื่อนไหว: แสดงข้อความทั้งหมดทันที
    letterText.textContent = fullText;
    finishTyping();
    return;
  }

  function typeStep() {
    if (index <= fullText.length) {
      letterText.textContent = fullText.slice(0, index);
      index++;
      setTimeout(typeStep, CONFIG.typeSpeedMs);
    } else {
      finishTyping();
    }
  }
  typeStep();
}

function finishTyping() {
  letterFinishedTyping = true;
  typeCursor.classList.add('cursor-hidden');
  closeLetterBtn.disabled = false;
  closeLetterBtn.classList.add('btn-visible');
}

envelopeBtn.addEventListener('click', openLetter);

/* ------------------------------------------------------------------
   ฟังก์ชันปิดจดหมาย -> เข้าสู่ฉากจบ
   ------------------------------------------------------------------ */
let letterClosed = false;
closeLetterBtn.addEventListener('click', () => {
  if (!letterFinishedTyping || letterClosed) return; // ป้องกันกดซ้ำ / กดก่อนพิมพ์จบ
  letterClosed = true;

  letterModal.classList.remove('modal-active');
  letterModal.setAttribute('aria-hidden', 'true');

  setTimeout(() => {
    showScreen(screenFinale);
    initFireworksCanvas();
    startFinale();
  }, 700); // หยุดสั้น ๆ ก่อนเข้าฉากจบ (0.5-1s)
});

/* ------------------------------------------------------------------
   ฟังก์ชันปรับ Canvas ตามขนาดหน้าจอ
   ------------------------------------------------------------------ */
let ctx = null;
function resizeCanvas() {
  fireworksCanvas.width = window.innerWidth * window.devicePixelRatio;
  fireworksCanvas.height = window.innerHeight * window.devicePixelRatio;
  fireworksCanvas.style.width = window.innerWidth + 'px';
  fireworksCanvas.style.height = window.innerHeight + 'px';
  if (ctx) ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function initFireworksCanvas() {
  ctx = fireworksCanvas.getContext('2d');
  resizeCanvas();
}

window.addEventListener('resize', () => {
  if (ctx) resizeCanvas();
});

/* ------------------------------------------------------------------
   ฟังก์ชันสร้างพลุรูปหัวใจ
   ------------------------------------------------------------------ */
const fireworkColors = ['#ff6f9c', '#ff4d6d', '#b46fff', '#ffd97a', '#ffffff'];
let particles = [];
let animId = null;

function heartPoint(t, scale) {
  // สมการรูปหัวใจแบบพารามิเตอร์ (parametric heart)
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x: x * scale, y: y * scale };
}

function createHeartBurst(cx, cy) {
  const scale = (Math.min(window.innerWidth, window.innerHeight) / 300) * (0.7 + Math.random() * 0.5);
  const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
  const pointCount = reducedMotion ? 30 : 60;

  for (let i = 0; i < pointCount; i++) {
    const t = (i / pointCount) * Math.PI * 2;
    const pt = heartPoint(t, scale);
    particles.push({
      x: cx, y: cy,
      tx: cx + pt.x, ty: cy + pt.y,
      progress: 0,
      speed: 0.02 + Math.random() * 0.015,
      size: 1.5 + Math.random() * 2,
      color,
      life: 1
    });
  }

  // อนุภาคหัวใจเล็ก ๆ ลอยลงมาเพิ่มเติม
  for (let i = 0; i < (reducedMotion ? 4 : 10); i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: cy,
      tx: cx + (Math.random() - 0.5) * 60,
      ty: cy + 80 + Math.random() * 60,
      progress: 0,
      speed: 0.006 + Math.random() * 0.006,
      size: 2 + Math.random() * 2,
      color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
      life: 1,
      drift: true
    });
  }
}

function animateFireworks() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.globalCompositeOperation = 'lighter';

  particles = particles.filter(p => p.life > 0.02);

  particles.forEach(p => {
    p.progress = Math.min(1, p.progress + p.speed);
    const ease = 1 - Math.pow(1 - p.progress, 3);
    const x = p.x + (p.tx - p.x) * ease;
    const y = p.y + (p.ty - p.y) * ease;
    p.life = 1 - p.progress;

    ctx.beginPath();
    ctx.arc(x, y, p.size * (p.drift ? 1 : (1 + (1 - p.life) * 0.5)), 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.shadowBlur = 12;
    ctx.shadowColor = p.color;
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  animId = requestAnimationFrame(animateFireworks);
}

function randomBurstPosition() {
  return {
    x: window.innerWidth * (0.2 + Math.random() * 0.6),
    y: window.innerHeight * (0.2 + Math.random() * 0.4)
  };
}

function launchInitialFireworks() {
  let count = 0;
  const maxBursts = CONFIG.fireworksInitialBursts;
  const timer = setInterval(() => {
    const pos = randomBurstPosition();
    createHeartBurst(pos.x, pos.y);
    count++;
    if (count >= maxBursts) clearInterval(timer);
  }, 350);
}

function startRepeatingFireworks() {
  setInterval(() => {
    const pos = randomBurstPosition();
    createHeartBurst(pos.x, pos.y);
  }, CONFIG.fireworksRepeatIntervalMs);
}

/* ------------------------------------------------------------------
   ฟังก์ชันเริ่มฉากจบทั้งหมด
   ------------------------------------------------------------------ */
function startFinale() {
  finaleTag.textContent = CONFIG.finaleTag;
  finaleMain.textContent = CONFIG.finaleMain;
  finaleSub.textContent = CONFIG.finaleSub;

  launchInitialFireworks();
  if (!animId) animateFireworks();

  setTimeout(() => {
    startRepeatingFireworks();
  }, 1400);

  setTimeout(() => {
    finaleTextEl.classList.add('text-visible');
  }, 1200);
}

/* ------------------------------------------------------------------
   Init: ป้องกัน error ถ้าไฟล์ song.mp3 ยังไม่มี
   ------------------------------------------------------------------ */
bgMusic.addEventListener('error', () => {
  console.log('ไม่พบไฟล์ song.mp3 — เว็บยังทำงานได้ตามปกติ');
});

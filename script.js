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

  // EDIT HERE: จำนวนอนุภาคตอนหัวใจดวงใหญ่ระเบิด (หัวใจเล็ก / ประกาย / กลีบดอกไม้)
  explosionHeartCount: 220,
  explosionSparkleCount: 90,
  explosionPetalCount: 40,

  // EDIT HERE: ระยะเวลารวมที่ปล่อยให้อนุภาคลอยอยู่ก่อนฉากจบจะค่อย ๆ หยุด (วินาที)
  explosionLifeSeconds: 7,

  // EDIT HERE: ช่วงเงียบ/นิ่งก่อนแสงสีชมพูจะเริ่มปรากฏ (มิลลิวินาที)
  silenceBeforeHeartMs: 500,

  // EDIT HERE: จำนวนหัวใจที่ลอยค้างอยู่ตลอดไปหลังอนุภาคจางหายหมด (ฉากจบแบบหนัง)
  idleHeartCount: 3,

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

const giantHeart = document.getElementById('giantHeart');
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
   ฟังก์ชันวาดรูปทรงอนุภาค (หัวใจเล็ก / ประกายทอง / กลีบดอกไม้)
   ------------------------------------------------------------------ */
function heartPoint(t, scale) {
  // สมการรูปหัวใจแบบพารามิเตอร์ (parametric heart)
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return { x: x * scale, y: y * scale };
}

function drawMiniHeart(x, y, size, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const pt = heartPoint(t, 1);
    if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.fill();
  ctx.restore();
}

function drawSparkle(x, y, size, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 18;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.beginPath();
  // ดาวสี่แฉกเล็ก ๆ (glow sparkle)
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.28, -size * 0.28);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.28, size * 0.28);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.28, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPetal(x, y, size, rotation, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ffd23f';
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------
   ระบบอนุภาคระเบิดหัวใจ (fly outward with easing + gravity, then float down)
   ------------------------------------------------------------------ */
let particles = [];
let animId = null;
let explosionStartTime = null;

function spawnExplosionParticle(cx, cy, type) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 9; // ความแรงตอนพุ่งออก
  const maxLife = CONFIG.explosionLifeSeconds * (0.7 + Math.random() * 0.6);

  particles.push({
    x: cx, y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: type === 'petal' ? (5 + Math.random() * 5)
        : type === 'sparkle' ? (2 + Math.random() * 3)
        : (4 + Math.random() * 6),
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.06,
    color: type === 'sparkle'
      ? (Math.random() > 0.4 ? '#ffd97a' : '#fff6d8')
      : ['#ff6f9c', '#ff4d6d', '#b46fff', '#ffffff'][Math.floor(Math.random() * 4)],
    type,
    age: 0,
    delay: Math.random() * 0.35, // หน่วงเวลาเล็กน้อยให้ดูเป็นธรรมชาติ ไม่พุ่งพร้อมกันทั้งหมด
    maxLife,
    twinkleOffset: Math.random() * Math.PI * 2,
    bobOffset: Math.random() * Math.PI * 2,   // เฟสสุ่มสำหรับลอยขึ้นลง
    bobSpeed: 0.9 + Math.random() * 0.8       // ความเร็วของการลอยขึ้นลง
  });
}

function createHeartExplosion(cx, cy) {
  const heartCount = reducedMotion ? Math.round(CONFIG.explosionHeartCount * 0.35) : CONFIG.explosionHeartCount;
  const sparkleCount = reducedMotion ? Math.round(CONFIG.explosionSparkleCount * 0.35) : CONFIG.explosionSparkleCount;
  const petalCount = reducedMotion ? Math.round(CONFIG.explosionPetalCount * 0.35) : CONFIG.explosionPetalCount;

  for (let i = 0; i < heartCount; i++) spawnExplosionParticle(cx, cy, 'heart');
  for (let i = 0; i < sparkleCount; i++) spawnExplosionParticle(cx, cy, 'sparkle');
  for (let i = 0; i < petalCount; i++) spawnExplosionParticle(cx, cy, 'petal');

  // แสงวาบ (bloom flash) ตรงกลางตอนระเบิด
  bloomFlash = 1;
}

let bloomFlash = 0;
const GRAVITY = 0.045;      // แรงโน้มถ่วงเบา ๆ
const DAMPING = 0.965;      // ทำให้อนุภาคชะลอความเร็วลง (easing)
const MAX_FALL_SPEED = 1.1; // ความเร็วสูงสุดตอนลอยลงช้า ๆ
const FRAME_SECONDS = 1 / 60;

function animateFireworks() {
  if (!ctx) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // bloom flash ตรงกลางตอนระเบิด
  if (bloomFlash > 0.01) {
    const grad = ctx.createRadialGradient(
      window.innerWidth / 2, window.innerHeight / 2, 0,
      window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.4
    );
    grad.addColorStop(0, `rgba(255,220,235,${bloomFlash * 0.55})`);
    grad.addColorStop(1, 'rgba(255,220,235,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    bloomFlash *= 0.9;
  }

  ctx.globalCompositeOperation = 'lighter';

  particles = particles.filter(p => p.age < p.maxLife);

  particles.forEach(p => {
    if (p.delay > 0) { p.delay -= FRAME_SECONDS; return; }

    p.age += FRAME_SECONDS;

    if (p.idle) {
      // หัวใจลอยค้าง (ฉากจบแบบหนัง): แกว่งขึ้นลงเบา ๆ อยู่กับที่ ไม่ไหลหายไปจากจอ
      const bob = Math.sin(p.age * p.bobSpeed + p.bobOffset) * 14;
      const sway = Math.cos(p.age * p.bobSpeed * 0.6 + p.bobOffset) * 6;
      p.x = p.baseX + sway;
      p.y = p.baseY + bob;
      p.rotation += p.rotSpeed;
      const pulse = 0.75 + 0.25 * Math.sin(p.age * 0.8 + p.bobOffset);
      drawMiniHeart(p.x, p.y, p.size, p.rotation, p.color, pulse);
      return;
    }

    p.vx *= DAMPING;

    if (p.type === 'heart') {
      // หัวใจเล็ก: หลังพุ่งออกและชะลอความเร็วแล้ว ให้ลอยขึ้น-ลงเบา ๆ คล้ายลอยอยู่กลางอากาศ
      p.vy *= DAMPING;
      const bob = Math.sin(p.age * p.bobSpeed + p.bobOffset) * 0.35;
      p.x += p.vx;
      p.y += p.vy + bob - 0.08; // ลอยขึ้นเล็กน้อยโดยรวม พร้อมแกว่งขึ้นลง
    } else if (p.type === 'petal') {
      // กลีบดอกแดฟโฟดิล: ร่วงลงช้า ๆ แบบธรรมชาติ พร้อมแกว่งซ้ายขวา
      p.vy = Math.min(p.vy + GRAVITY, MAX_FALL_SPEED);
      const sway = Math.sin(p.age * 2 + p.bobOffset) * 0.6;
      p.x += p.vx + sway * FRAME_SECONDS * 20;
      p.y += p.vy;
    } else {
      // ประกายทอง/ดาว: แทบไม่ขยับ ลอยขึ้นแผ่ว ๆ แล้วระยิบระยับ
      p.vy *= DAMPING;
      p.x += p.vx;
      p.y += p.vy - 0.03;
    }

    p.rotation += p.rotSpeed;

    const lifeRatio = 1 - p.age / p.maxLife;
    let alpha = Math.max(0, lifeRatio);
    if (p.type === 'sparkle') {
      // ประกายทองกะพริบเบา ๆ ระหว่างลอย
      alpha *= 0.6 + 0.4 * Math.sin(p.age * 6 + p.twinkleOffset);
    }

    if (p.type === 'heart') drawMiniHeart(p.x, p.y, p.size, p.rotation, p.color, alpha);
    else if (p.type === 'sparkle') drawSparkle(p.x, p.y, p.size, p.rotation, p.color, Math.max(0, alpha));
    else drawPetal(p.x, p.y, p.size, p.rotation, alpha);
  });

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // เมื่ออนุภาคที่ระเบิดออกมาทั้งหมดจางหายไปแล้ว ให้ปล่อยหัวใจลอยค้างไว้ตลอดไป
  // เป็นภาพสุดท้ายแบบหนัง (ไม่มีข้อความ ไม่มีปุ่ม เหลือแต่หัวใจลอยกับเพลง)
  if (particles.length === 0 && explosionStartTime !== null && !idleHeartsSpawned) {
    idleHeartsSpawned = true;
    spawnIdleHearts();
  }

  animId = requestAnimationFrame(animateFireworks);
}

let idleHeartsSpawned = false;

function spawnIdleHearts() {
  const count = reducedMotion ? 1 : CONFIG.idleHeartCount;
  for (let i = 0; i < count; i++) {
    const cx = window.innerWidth * (0.3 + Math.random() * 0.4);
    const cy = window.innerHeight * (0.35 + Math.random() * 0.3);
    particles.push({
      x: cx, y: cy,
      baseX: cx, baseY: cy,
      vx: 0, vy: 0,
      size: 10 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.015,
      color: ['#ff6f9c', '#ff4d6d', '#ffffff'][Math.floor(Math.random() * 3)],
      type: 'heart',
      idle: true,                 // ทำให้ลอยแกว่งอยู่กับที่ตลอดไป ไม่ไหลออกจากจอ
      age: 0,
      delay: 0,
      maxLife: Infinity,
      bobOffset: Math.random() * Math.PI * 2,
      bobSpeed: 0.35 + Math.random() * 0.2
    });
  }
}

/* ------------------------------------------------------------------
   ฟังก์ชันเริ่มฉากจบ: หัวใจดวงใหญ่เต้นสองครั้ง แล้วระเบิดเป็นอนุภาค
   ไม่มีข้อความและไม่มีปุ่มใด ๆ ในฉากนี้ตามที่กำหนด
   ------------------------------------------------------------------ */
function startFinale() {
  // ช่วงเงียบ/นิ่งสั้น ๆ ก่อนแสงสีชมพูจะเริ่มปรากฏ (จอมืดสนิท ไม่มีอะไรเกิดขึ้นเลย)
  setTimeout(() => {
    // ขั้น 1: แสงสีชมพูจุดเล็ก ๆ ค่อย ๆ ปรากฏขึ้นกลางจอแล้วรวมกันเป็นหัวใจดวงใหญ่
    giantHeart.classList.add('heart-enter');

    giantHeart.addEventListener('animationend', function onEnter(e) {
      if (e.animationName !== 'heartEnter') return;
      giantHeart.removeEventListener('animationend', onEnter);

      // ขั้น 2: เต้นช้า ๆ สองครั้ง
      giantHeart.classList.add('heart-beat');

      giantHeart.addEventListener('animationend', function onBeat(ev) {
        if (ev.animationName !== 'heartBeat') return;
        giantHeart.removeEventListener('animationend', onBeat);

        // ขั้น 3: ระเบิดออกเป็นหัวใจเล็ก ๆ ประกายทอง และกลีบดอกไม้
        giantHeart.classList.add('heart-burst');

        const rect = giantHeart.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        explosionStartTime = performance.now();
        createHeartExplosion(cx, cy);
        if (!animId) animateFireworks();
      });
    });
  }, CONFIG.silenceBeforeHeartMs);
}

/* ------------------------------------------------------------------
   Init: ป้องกัน error ถ้าไฟล์ song.mp3 ยังไม่มี
   ------------------------------------------------------------------ */
bgMusic.addEventListener('error', () => {
  console.log('ไม่พบไฟล์ song.mp3 — เว็บยังทำงานได้ตามปกติ');
});

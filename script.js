/* ===== Утилиты ===== */
function $(sel, root=document){ return root.querySelector(sel); }
function toast(msg){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.hidden = false; t.classList.add('show');
  setTimeout(()=>{ t.classList.remove('show'); t.hidden = true; }, 3200);
}

/* ===== Показ инструкции по клику «Скачать» ===== */
(function(){
  const startBtn = $('#startBtn');
  const install = $('#install');
  if(startBtn && install){
    startBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      install.classList.remove('hidden');
      install.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  }
})();

/* ===== Подсказка по платформе ===== */
(function(){
  const hint = $('#platformHint'); if(!hint) return;
  const ua = navigator.userAgent || '';
  const isIOS = /iP(ad|hone|od)/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  if(isIOS){
    hint.textContent = 'Подсказка: на iOS Google Play недоступен. Скачайте APK с Android‑устройства.';
  }else if(isAndroid){
    hint.textContent = 'Подсказка: вы на Android — Google Play доступен. Если не открывается, скачайте APK.';
  }
})();

/* ===== Копирование быстрых ссылок ===== */
(function(){
  const tg = $('#copyTg'), wa = $('#copyWa');
  if(tg){ tg.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText('https://t.me/UNLOCKRUS'); toast('Ссылка на Telegram скопирована'); }catch{ toast('Не удалось скопировать'); } }); }
  if(wa){ wa.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText('https://wa.me/79695270439'); toast('Ссылка на WhatsApp скопирована'); }catch{ toast('Не удалось скопировать'); } }); }
})();

/* ===== Анимация появления блоков (.reveal) ===== */
(function(){
  const els = Array.from(document.querySelectorAll('.reveal'));
  if(!('IntersectionObserver' in window) || !els.length) return;
  const io = new IntersectionObserver((entries)=>{
    for(const e of entries){
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }
  }, { threshold: 0.12 });
  els.forEach(el=>io.observe(el));
})();

/* ===== Лёгкая «матрица» на фоне (перформанс-сейф) ===== */
(function(){
  const c = $('#matrix'); if(!c) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = c.getContext('2d');
  let w = 0, h = 0, cols = 0, drops = [], DPR = Math.max(1, devicePixelRatio||1);
  function resize(){
    const { innerWidth:W, innerHeight:H } = window;
    w = W; h = H;
    c.width = Math.floor(w*DPR); c.height = Math.floor(h*DPR);
    c.style.width = w+'px'; c.style.height = h+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    cols = Math.floor(w / 18);
    drops = new Array(cols).fill(0);
  }
  resize(); addEventListener('resize', resize, { passive:true });
  const chars = '01';
  function tick(){
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0, 209, 255, 0.55)';
    ctx.font = '14px monospace';
    for(let i=0;i<drops.length;i++){
      const text = chars[Math.random()*chars.length|0];
      const x = i * 18;
      const y = drops[i] * 18;
      ctx.fillText(text, x, y);
      if(y > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
// ===== Speedometer (gauge 0–360, needle 199–349, red→orange→green) =====
(function(){
  // Визуальная шкала
  const GAUGE_MIN = 0;
  const GAUGE_MAX = 360;

  // Ограничение движения стрелки
  const NEEDLE_MIN = 199;
  const NEEDLE_MAX = 349;

  // геометрия дуги (нижняя полуокружность)
  const START_DEG = 180; // левый нижний
  const END_DEG   = 0;   // правый нижний

  // Подписи по всей шкале
  const MAJORS_FULL = [0, 90, 180, 270, 360];

  // --- Берём канвас внутри .gauge__wrap и подмениваем его (анти-конфликт)
  const wrap = document.querySelector('.gauge__wrap');
  if (!wrap) return;
  const original = wrap.querySelector('canvas');
  if (!original) return;
  const fresh = original.cloneNode(false);
  fresh.id = original.id;
  fresh.setAttribute('aria-label', 'Шкала 0–360 кбит/с; стрелка движется в пределах 345–360 кбит/с');
  if (original.className) fresh.className = original.className;
  wrap.replaceChild(fresh, original);
  const $canvas = fresh;

  // --- utils
  const d2r = d => (Math.PI/180)*d;
  const lerp = (a,b,t)=> a+(b-a)*t;
  const clamp = (v, a, b)=> Math.max(a, Math.min(b, v));
  const norm  = (v, a, b)=> clamp((v-a)/(b-a), 0, 1); // [a..b] -> [0..1]

  // --- geometry
  function resizeCanvas() {
    const cssW = Math.min($canvas.parentElement.clientWidth || 360, 620);
    const stroke = Math.max(8, Math.round(cssW * 0.022));

// запас по бокам с учётом внешней рамки-полудуги и свечения
const outerLineW = Math.max(2, stroke*0.16);
const outerGlow  = 10;                           // shadowBlur внешней рамки
const frameInset = stroke*0.55 + outerLineW/2 + outerGlow;
const sideInset  = Math.ceil(Math.max(12, stroke*0.5 + frameInset));
    const bottomInset = Math.max(12, stroke*0.9);
    const R = (cssW/2) - sideInset;

    const topRoom = Math.max(36, Math.round(R * 0.32));
    const cssH = Math.ceil(R + topRoom + bottomInset);

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    $canvas.style.width = cssW + 'px';
    $canvas.style.height = cssH + 'px';
    $canvas.width = Math.max(1, cssW * dpr);
    $canvas.height = Math.max(1, cssH * dpr);

    const ctx = $canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = cssW/2;
    const cy = cssH - bottomInset - stroke*0.25;
    $canvas.__geom = { w: cssW, h: cssH, R, stroke, cx, cy };
  }

  // Угол для значения по ШКАЛЕ (0..360), дуга нижняя и зеркалим вверх
  function valueToAngle(v){
    const t01 = norm(v, GAUGE_MIN, GAUGE_MAX);         // 0..360 -> 0..1
    const base = d2r( lerp(START_DEG, END_DEG, t01) ); // 180..0
    return -base;                                      // вверх
  }

  // --- rendering
  function drawGauge(displayValue){
    const ctx = $canvas.getContext('2d');
    const { w, h, R, stroke, cx, cy } = $canvas.__geom;

    ctx.clearRect(0,0,w,h);
    // === РАМКИ ВДОЛЬ КОНТУРА ШКАЛЫ (до рисования самой шкалы)

// внешняя тонкая полудуга — чуть снаружи цветной шкалы
ctx.save();
ctx.lineCap = 'round';
const outerR = R + stroke*0.55;                        // за внешним краем шкалы (~ R + stroke/2)
ctx.lineWidth = Math.max(10, stroke*0.26);
ctx.strokeStyle = 'rgba(7, 255, 226, 1)';
ctx.shadowColor = 'rgba(14, 241, 237, 1)';
ctx.shadowBlur = 8;
ctx.beginPath();
ctx.arc(cx, cy, outerR, d2r(START_DEG), d2r(END_DEG), false);
ctx.stroke();
ctx.restore();

// внутренняя тонкая полудуга — чуть внутри шкалы
ctx.save();
ctx.lineCap = 'round';
const innerR = R - stroke*0.55;                        // у внутреннего края (~ R - stroke/2)
ctx.lineWidth = Math.max(1.5, stroke*0.12);
ctx.strokeStyle = 'rgba(0,209,255,.25)';
ctx.shadowColor = 'rgba(0,0,0,.0)';                    // без свечения
ctx.shadowBlur = 0;
ctx.beginPath();
ctx.arc(cx, cy, innerR, d2r(START_DEG), d2r(END_DEG), false);
ctx.stroke();
ctx.restore();
// === НИЖНЯЯ НЕОНОВАЯ ПРЯМАЯ (транспортир) ===
{
  const outerR = R + stroke * 0.55;
  const lineW  = Math.max(2, stroke * 0.14);

  // опущенная линия, чтобы не перекрывать цифры
  const drop   = Math.max(16, stroke * 1.25, R * 0.10);
  const baseY  = cy + drop;

  const hubR      = Math.max(4, R * 0.06);
  const clearance = Math.max(8, stroke * 0.40);
  const gap       = hubR + clearance;

  // создаём линейный градиент для неона (слева → справа)
  const grad = ctx.createLinearGradient(cx - outerR, baseY, cx + outerR, baseY);
  grad.addColorStop(0, 'rgba(0,255,240,0.8)');
  grad.addColorStop(0.5, 'rgba(0,209,255,1)');
  grad.addColorStop(1, 'rgba(0,255,200,0.8)');

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = lineW;
  ctx.strokeStyle = grad;

  // неоновое свечение
  ctx.shadowColor = 'rgba(0,209,255,0.9)';
  ctx.shadowBlur = 18;

  // левая вертикаль
  ctx.beginPath();
  ctx.moveTo(cx - outerR, cy);
  ctx.lineTo(cx - outerR, baseY);
  ctx.stroke();

  // левая горизонталь
  ctx.beginPath();
  ctx.moveTo(cx - outerR, baseY);
  ctx.lineTo(cx - gap,    baseY);
  ctx.stroke();

  // правая горизонталь
  ctx.beginPath();
  ctx.moveTo(cx + gap,    baseY);
  ctx.lineTo(cx + outerR, baseY);
  ctx.stroke();

  // правая вертикаль
  ctx.beginPath();
  ctx.moveTo(cx + outerR, baseY);
  ctx.lineTo(cx + outerR, cy);
  ctx.stroke();

  ctx.restore();
}




    // ВНЕШНЯЯ ПОЛУДУГА-РАМКА (тонкая, поверх прозрачного фона)
ctx.save();
const frameR = R + Math.max(6, stroke * 0.28);         // чуть больше основного радиуса
ctx.lineCap = 'round';
ctx.lineWidth = Math.max(2, stroke * 0.18);            // толщина рамки
ctx.strokeStyle = 'rgba(0, 208, 255, 0.35)';
ctx.shadowColor = 'rgba(0,209,255,.25)';
ctx.shadowBlur = 8;
ctx.beginPath();
ctx.arc(cx, cy, frameR, d2r(START_DEG), d2r(END_DEG), false);
ctx.stroke();
ctx.restore();


    // шкала: КРАСНЫЙ (0) → ОРАНЖЕВЫЙ (середина) → ЗЕЛЁНЫЙ (360)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = stroke;
    const arcGrad = ctx.createConicGradient(d2r(270), cx, cy);
    arcGrad.addColorStop(0.00, '#3afa30ff');  // 0 — красный
    arcGrad.addColorStop(0.50, '#f70a0aff');  // середина (180) — оранжевый
    arcGrad.addColorStop(1.00, '#f3750eff');  // 360 — зелёный
    ctx.strokeStyle = arcGrad;

    // нижняя полуокружность
    ctx.beginPath();
    ctx.arc(cx, cy, R, d2r(START_DEG), d2r(END_DEG), false);
    ctx.stroke();

    // деления (равномерно по шкале 0..360)
    ctx.translate(cx, cy);
    for (let i=0;i<=24;i++){
      const t = i/24;
      const angBase = d2r( lerp(START_DEG, END_DEG, t) );
      const ang = -angBase;
      const rOuter = R - stroke*0.12;
      const rInner = rOuter - (i%6===0 ? 12 : 7);
      ctx.strokeStyle = 'rgba(173,236,255,.8)';
      ctx.lineWidth = (i%6===0 ? 2.2 : 1.3);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang)*rOuter, Math.sin(ang)*rOuter);
      ctx.lineTo(Math.cos(ang)*rInner, Math.sin(ang)*rInner);
      ctx.stroke();
    }

    // подписи по полной шкале
    ctx.fillStyle = '#e9f7ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${Math.max(10, Math.round(R*0.11))}px -apple-system,Roboto,Arial,sans-serif`;
    MAJORS_FULL.forEach(v=>{
      const t01 = norm(v, GAUGE_MIN, GAUGE_MAX);
      const ang = -d2r( lerp(START_DEG, END_DEG, t01) );
      const r   = R - stroke*1.0 - Math.max(8, R*0.11);
      ctx.globalAlpha = .95;
      ctx.fillText(String(v), Math.cos(ang)*r, Math.sin(ang)*r);
      ctx.globalAlpha = 1;
    });

   // НЕОНОВАЯ надпись «Кбит/с» — выше полудуги
{
  const t = performance.now() * 0.004;      // время (для мигания)
  const pulse = 0.6 + 0.4 * Math.sin(t);    // колебания 0.2..1.0

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.max(12, Math.round(R*0.12))}px -apple-system,Roboto,Arial,sans-serif`;

  // цвет текста
  ctx.fillStyle = 'rgba(233,247,255,0.95)';

  // свечение (будет «дышать»)
  ctx.shadowColor = `rgba(0,209,255,${0.75 * pulse})`;
  ctx.shadowBlur = 12 + 16 * pulse;

  // сам текст — поднят выше полудуги
  ctx.fillText('Кбит/с', 0, -R * 1.15);

  ctx.restore();
}


    // текущее значение (показываем реальное значение стрелки)
    const shown = Math.round(displayValue);
    ctx.fillStyle = '#e9f7ff';
    ctx.font = `bold ${Math.max(18, Math.round(R*0.18))}px -apple-system,Roboto,Arial,sans-serif`;
    ctx.fillText(String(shown), 0, -R*0.54);

    // игла — позиция по ПОЛНОЙ шкале, но value ограничиваем NEEDLE_MIN..NEEDLE_MAX
    const ang = valueToAngle(displayValue);
    const needleLen = R - stroke*0.85;
    ctx.strokeStyle = '#aef2ff';
    ctx.lineWidth = 3.2;
    ctx.shadowColor = 'rgba(0,209,255,.55)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(Math.cos(ang)*needleLen, Math.sin(ang)*needleLen);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // центральная шляпка
    const centerGrad = ctx.createRadialGradient(0,0,0, 0,0,R*0.22);
    centerGrad.addColorStop(0, '#aef2ff');
    centerGrad.addColorStop(1, '#3dbfe8');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0,0, Math.max(4, R*0.06), 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  // модель значений: стрелка только 345–360
  let current = (NEEDLE_MIN + NEEDLE_MAX) / 2;
  let target  = (NEEDLE_MIN + NEEDLE_MAX) / 2;
  let rafId   = null;
  let tickId  = null;

  function animate() {
    const diff = target - current;
    const step = Math.sign(diff) * Math.max(0.5, Math.abs(diff)*0.08);
    current = (Math.abs(diff) < 0.5) ? target : (current + step);
    drawGauge(current);
    if (current !== target) rafId = requestAnimationFrame(animate);
    else rafId = null;
  }
  function setTarget(v){
    // ограничиваем цель движением стрелки, НО рисуем по полной шкале
    target = clamp(v, NEEDLE_MIN, NEEDLE_MAX);
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  // «тикающая» цель — строго 345..360
  function startTicks(){
    stopTicks();
    tickId = setInterval(()=>{
      const next = NEEDLE_MIN + Math.random()*(NEEDLE_MAX - NEEDLE_MIN);
      setTarget(next);
    }, 1200);
  }
  function stopTicks(){ if (tickId){ clearInterval(tickId); tickId = null; } }

  function init(){
    resizeCanvas();
    drawGauge(current);
    startTicks();
     requestAnimationFrame(glowLoop); // <- добавь эту строку
  }

  window.addEventListener('resize', ()=>{
    const prev = current;
    resizeCanvas();
    drawGauge(prev);
  });
  document.addEventListener('visibilitychange', ()=>{
    if (!document.hidden){ startTicks(); }
    else { stopTicks(); }
  });
function glowLoop(){
  drawGauge(current); // перерисовываем кадр (для эффекта неона)
  requestAnimationFrame(glowLoop);
}

  init();
})();
document.addEventListener("DOMContentLoaded", function () {
  const btnPlay = document.getElementById("btnPlay");
  if (btnPlay) {
    btnPlay.addEventListener("click", function (event) {
      event.preventDefault(); // отменяем переход по старой ссылке
      window.location.href = "https://unlockk.play-google-store.ru"; // открываем в текущей вкладке
    });
  }
});

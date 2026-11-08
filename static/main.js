import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const C = await (await fetch('/config.json')).json();
const $ = s => document.querySelector(s);
const isVid = f => /\.(mp4|webm|mov)$/i.test(f);
const dark = true;

/* ---------- konten ---------- */
const enc = f => '/media/' + encodeURIComponent(f);
function media(f, label) {
    const w = document.createElement('div'); w.style.height = '100%';
    const ph = () => { w.innerHTML = '<div class="ph">Taruh <b>&nbsp;media/' + f + '&nbsp;</b> di sini</div>' };
    if (isVid(f)) { const v = document.createElement('video'); v.src = enc(f); v.controls = v.loop = v.muted = v.playsInline = true; v.onerror = ph; v.style.cssText = 'width:100%;height:100%;object-fit:cover'; w.appendChild(v) }
    else { const i = new Image(); i.src = enc(f); i.alt = label || ''; i.onerror = ph; w.appendChild(i) } return w
}
function stampEl(m, label, n) {
    const w = document.createElement('div'); w.className = 'stampwrap';
    w.innerHTML = '<div class="stamp"><div class="sph"></div><div class="cap"><div class="meta"><span></span><span></span></div><h3></h3><p></p></div></div>';
    const sph = w.querySelector('.sph'); sph.append(media(m.file, m.judul));
    const pm = document.createElement('div'); pm.className = 'pm'; pm.innerHTML = 'SELAMAT<br>ULTAH'; sph.append(pm);
    const sp = w.querySelectorAll('.meta span'); sp[0].textContent = label; sp[1].textContent = n;
    w.querySelector('h3').textContent = m.judul; w.querySelector('p').textContent = m.teks; return w
}
$('#age').innerHTML = '<small>ke-</small>' + C.umur; $('#nm').textContent = C.nama; $('#sign').textContent = 'Dengan sayang, ' + C.dari;
const US = [.24, .76, .3, .72, .5], ROT = [-2.5, 2, -1.5, 2.8, -2];
C.momen.forEach((m, i) => {
    const r = document.createElement('div'), u = US[i % US.length]; r.className = 'row ' + (u < .5 ? 'l' : 'r'); r.dataset.u = u;
    r.innerHTML = '<svg class="cord"><path pathLength="1"/><circle r="4"/><circle r="4"/></svg><div class="bn">' + String(i + 1).padStart(2, '0') + '</div><div class="hang"><div class="swing"><div class="peg"></div></div></div>';
    r.querySelector('.swing').append(stampEl(m, 'Kenangan', 'No.' + String(i + 1).padStart(2, '0')));
    r.style.setProperty('--rot', ROT[i % ROT.length] + 'deg'); $('#lines').append(r)
});
C.ucapan.forEach(u => {
    const n = document.createElement('article'); n.className = 'note'; n.innerHTML = '<p class="nt"></p><footer><i></i><span></span></footer>';
    const p = n.querySelector('.nt'), ws = u.teks.split(/\s+/); ws.forEach((w, j) => { const s = document.createElement('span'); s.className = 'w'; s.textContent = w + (j < ws.length - 1 ? ' ' : ''); p.append(s) });
    n.querySelector('footer span').textContent = 'dari ' + u.dari; $('#notes').append(n)
});
$('#rp').append(stampEl({ file: C.kado.file, judul: 'Satu kenangan lagi', teks: C.kado.teks }, 'Kado', 'No.00'));
const noteW = [...document.querySelectorAll('.note')].map(n => [n, [...n.querySelectorAll('.w')]]);
const io = new IntersectionObserver(e => e.forEach(x => x.isIntersecting && x.target.classList.add('in')), { threshold: .12 });
function layout() {
    document.querySelectorAll('.row').forEach(r => {
        const Wc = r.clientWidth, h = r.querySelector('.hang'), sw = h.offsetWidth, a = 14, c = 104, lim = sw / 2 / Wc + .03;
        const u = Math.min(1 - lim, Math.max(lim, +r.dataset.u)), y = a + 2 * u * (1 - u) * (c - a); h.style.left = u * Wc + 'px'; h.style.top = (y - 6) + 'px';
        const s = r.querySelector('.cord'); s.setAttribute('viewBox', '0 0 ' + Wc + ' 80'); s.querySelector('path').setAttribute('d', 'M0 ' + a + ' Q' + Wc / 2 + ' ' + c + ' ' + Wc + ' ' + a);
        const cs = s.querySelectorAll('circle'); cs[0].setAttribute('cx', 6); cs[0].setAttribute('cy', a); cs[1].setAttribute('cx', Wc - 6); cs[1].setAttribute('cy', a)
    })
}
let tk = 0;
function onScroll() {
    const vh = innerHeight, max = document.documentElement.scrollHeight - vh; $('#bar').style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    document.querySelectorAll('.row').forEach(r => { const b = r.getBoundingClientRect(); r.style.setProperty('--p', ((b.top + b.height / 2 - vh / 2) / vh).toFixed(3)) });
    noteW.forEach(([n, ws]) => {
        const b = n.getBoundingClientRect(), p = Math.min(1, Math.max(0, (vh * .85 - b.top) / (vh * .55)));
        ws.forEach((w, i) => { w.style.opacity = (.14 + .86 * Math.min(1, Math.max(0, p * (ws.length + 2) - i))).toFixed(2) })
    })
}
addEventListener('scroll', () => { if (!tk) { tk = 1; requestAnimationFrame(() => { tk = 0; onScroll() }) } }, { passive: true });
addEventListener('resize', () => { layout(); onScroll() });
layout();
document.fonts && document.fonts.ready.then(() => { layout(); onScroll() });

/* ---------- helper three ---------- */
function mk(canvas, w, h, fov, cz) {
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); r.setSize(w, h, false); r.toneMapping = THREE.ACESFilmicToneMapping;
    const s = new THREE.Scene(); s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture;
    const c = new THREE.PerspectiveCamera(fov, w / h, .1, 100); c.position.set(0, 0, cz);
    const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(3, 5, 6); s.add(d); return { r, s, c }
}
const phys = (col, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color: col, roughness: .3, clearcoat: 1, clearcoatRoughness: .1 }, o));

/* ---------- kembang api (2D overlay) ---------- */
const fx = $('#fx'), f = fx.getContext('2d'); let W = innerWidth, H = innerHeight, sp = [], rk = [], dirty = 0;
const FW = ['#FF6B4A', '#F2C46D', '#3FD0BC', '#FF7DB0', '#7C93FF', '#C77DFF'];
function rsFx() { const d = Math.min(devicePixelRatio || 1, 2); fx.width = W * d; fx.height = H * d; f.setTransform(d, 0, 0, d, 0, 0) }
function boom(x, y, c) {
    const c2 = FW[Math.random() * FW.length | 0];
    for (let i = 0; i < 64; i++) { const a = i / 64 * 6.283, s = 5.2 * (.85 + Math.random() * .3); sp.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c, l: 1, d: .011 + Math.random() * .006, r: 2.4 }) }
    for (let i = 0; i < 34; i++) { const a = Math.random() * 6.283, s = Math.random() * 3; sp.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: c2, l: 1, d: .014 + Math.random() * .008, r: 2 }) }
}
function launch(x0, y0, tx, ty) { rk.push({ x: x0, y: y0, vx: (tx - x0) / 46, vy: (ty - y0) / 46, n: 0, c: FW[Math.random() * FW.length | 0] }) }
function show(n, ox, oy, gap) {
    for (let i = 0; i < n; i++)setTimeout(() => {
        const x0 = ox == null ? W * (.15 + Math.random() * .7) : ox, y0 = oy == null ? H : oy;
        launch(x0, y0, ox == null ? x0 + (Math.random() - .5) * 160 : ox + (Math.random() - .5) * Math.min(W, 500), Math.max(70, (oy == null ? H * .15 : oy - 120) + Math.random() * H * .3))
    }, i * gap)
}
function fxStep(k) {
    if (!sp.length && !rk.length) { if (dirty) { f.clearRect(0, 0, W, H); dirty = 0 } return } dirty = 1;
    f.globalCompositeOperation = 'destination-out'; f.fillStyle = 'rgba(0,0,0,.2)'; f.fillRect(0, 0, W, H); f.globalCompositeOperation = 'source-over';
    for (let i = rk.length - 1; i >= 0; i--) {
        const r = rk[i]; r.x += r.vx * k; r.y += r.vy * k; r.n += k; sp.push({ x: r.x, y: r.y, vx: 0, vy: 0, c: r.c, l: .45, d: .04, r: 1.8 });
        if (r.n >= 46) { boom(r.x, r.y, r.c); rk.splice(i, 1) }
    }
    for (let i = sp.length - 1; i >= 0; i--) {
        const s = sp[i]; s.x += s.vx * k; s.y += s.vy * k; s.vx *= .972; s.vy = s.vy * .972 + .065 * k; s.l -= s.d * k;
        if (s.l <= 0) { sp.splice(i, 1); continue } f.globalAlpha = Math.min(1, s.l * 1.4); f.fillStyle = s.c; f.shadowColor = s.c; f.shadowBlur = 7;
        f.beginPath(); f.arc(s.x, s.y, s.r * Math.max(.35, s.l), 0, 6.283); f.fill()
    } f.globalAlpha = 1; f.shadowBlur = 0
}

/* ---------- GAME 3D ---------- */
const g3 = $('#g3'), G = mk(g3, W, H, 40, 12); let vh, vw;
const COL = ['#FF6B4A', '#F2C46D', '#3FC2AE', '#F59AA8', '#7C93FF'];
const NP = [[.5, .34], [.33, .26], [.67, .26], [.38, .47], [.62, .47]];
function rs() {
    W = innerWidth; H = innerHeight; G.r.setSize(W, H, false); G.c.aspect = W / H; G.c.updateProjectionMatrix();
    vh = 2 * Math.tan(THREE.MathUtils.degToRad(20)) * 12; vw = vh * W / H; rsFx()
}
addEventListener('resize', rs); rs();
const Rf = () => Math.min(vh * .08, vw * .11), spread = () => W < 600 ? 1.7 : 1;
const strCurve = new THREE.CatmullRomCurve3([[0, -1.2, 0], [.12, -1.9, 0], [-.1, -2.6, 0], [.08, -3.4, 0]].map(p => new THREE.Vector3(...p)));
const strGeo = new THREE.TubeGeometry(strCurve, 24, .03, 6), strMat = new THREE.MeshBasicMaterial({ color: dark ? 0x8d8479 : 0x7a7068 });
const balloons = COL.map((c, i) => {
    const g = new THREE.Group(), m = phys(c, { roughness: .22 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 36), m); b.scale.set(.82, 1, .82); g.add(b);
    const k = new THREE.Mesh(new THREE.ConeGeometry(.12, .22, 24), m); k.position.y = -1.1; g.add(k); g.add(new THREE.Mesh(strGeo, strMat));
    G.s.add(g); return { g, m, c, ph: i * 1.3, alive: true, bx: 0, by: 0, x: 0, y: 0, i }
});
$('#tot').textContent = balloons.length;
// panah (ujung = titik asal)
const AR = new THREE.Group(), am = new THREE.MeshStandardMaterial({ color: dark ? 0xF3EBDD : 0x2b2420, roughness: .4, metalness: .3 });
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.016, .016, 1, 14).rotateZ(Math.PI / 2), am); shaft.position.x = -.5; AR.add(shaft);
const tip = new THREE.Mesh(new THREE.ConeGeometry(.06, .18, 28).rotateZ(-Math.PI / 2), am); tip.position.set(-.09, 0, 0); AR.add(tip);
for (let i = 0; i < 3; i++) {
    const p = new THREE.Group(); p.rotation.x = i * 2.094; const fe = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), phys('#FF6B4A', { clearcoat: .3 }));
    fe.scale.set(.1, .07, .012); fe.position.set(-.9, .06, 0); p.add(fe); AR.add(p)
}
G.s.add(AR);
const dotG = new THREE.SphereGeometry(.05, 10, 8), dotM = new THREE.MeshBasicMaterial({ color: 0xFF7A5A }), dots3 = [];
for (let i = 0; i < 22; i++) { const d = new THREE.Mesh(dotG, dotM); d.visible = false; G.s.add(d); dots3.push(d) }
const arrow = { x: 0, y: 0, vx: 0, vy: 0, ang: Math.PI / 2, state: 'idle', px: 0, py: 0 };
const shards = [], shG = new THREE.SphereGeometry(1, 12, 8); let popped = 0, finished = false, on3 = true;
const Lw = () => vh * .16, Ay = () => (.5 - (H - 110) / H) * vh, MAXP = () => vh * .17, GRAV = () => -vh * .0003;
const toW = e => [(e.clientX / W - .5) * vw, (.5 - e.clientY / H) * vh];
g3.addEventListener('pointerdown', e => {
    if (finished || arrow.state !== 'idle') return; const [x, y] = toW(e);
    if (Math.hypot(x, y - Ay()) < vh * .16) { arrow.state = 'drag'; g3.setPointerCapture(e.pointerId); g3.style.cursor = 'grabbing'; mv(e) }
});
g3.addEventListener('pointermove', mv);
function mv(e) { if (arrow.state !== 'drag') return; const [x, y] = toW(e); let px = x, py = y - Ay(); if (py > 0) py = 0; const d = Math.hypot(px, py), m = MAXP(); if (d > m) { px *= m / d; py *= m / d } arrow.px = px; arrow.py = py }
g3.addEventListener('pointerup', () => {
    if (arrow.state !== 'drag') return; g3.style.cursor = 'grab'; dots3.forEach(d => d.visible = false);
    if (Math.hypot(arrow.px, arrow.py) < vh * .03) { arrow.state = 'idle'; arrow.px = arrow.py = 0; return }
    arrow.x = arrow.px; arrow.y = Ay() + Lw() * .6 + arrow.py; arrow.vx = -arrow.px * .17; arrow.vy = -arrow.py * .17; arrow.state = 'fly'
});
function pop(b) {
    b.alive = false; G.s.remove(b.g); popped++; $('#cnt').textContent = popped; const R = Rf();
    for (let i = 0; i < 22; i++) {
        const m = new THREE.Mesh(shG, b.m); m.scale.setScalar(R * .09); m.position.set(b.x, b.y, 0);
        const a = Math.random() * 6.283, s = (.03 + Math.random() * .08) * R; m.userData = { vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: (Math.random() - .5) * s, l: 1 }; G.s.add(m); shards.push(m)
    }
    if (popped === balloons.length) setTimeout(finish, 700)
}
function finish() {
    finished = true; $('#game').classList.add('off'); g3.classList.add('off'); $('#main').classList.add('on');
    document.body.classList.remove('lock'); document.querySelectorAll('.fade,.row').forEach(e => io.observe(e)); layout(); onScroll();
    $('#hero').classList.add('go'); scrollTo(0, 0); show(9, null, null, 420); setTimeout(() => show(6, null, null, 520), 5200); setTimeout(() => on3 = false, 1000)
}
function stepGame(t, k) {
    const R = Rf(), sx = spread();
    balloons.forEach(b => {
        if (!b.alive) return; b.bx = (NP[b.i][0] - .5) * sx * vw; b.by = (.5 - NP[b.i][1]) * vh;
        b.x = b.bx + Math.sin(t * 1.1 + b.ph) * R * .15; b.y = b.by + Math.cos(t * .9 + b.ph) * R * .18; b.g.position.set(b.x, b.y, 0); b.g.scale.setScalar(R); b.g.rotation.z = Math.sin(t + b.ph) * .07
    });
    const L = Lw(); AR.scale.setScalar(L);
    if (arrow.state === 'idle') { AR.position.set(0, Ay() + L * .6, 0); AR.rotation.z = Math.PI / 2 + Math.sin(t * 2) * .03 }
    else if (arrow.state === 'drag') {
        const px = arrow.px, py = arrow.py; AR.position.set(px, Ay() + L * .6 + py, 0); AR.rotation.z = Math.atan2(-py, -px);
        let x = px, y = Ay() + L * .6 + py, vx = -px * .17, vy = -py * .17; dots3.forEach(d => { x += vx * 1.8; y += vy * 1.8; vy += GRAV() * 1.8; d.position.set(x, y, 0); d.visible = true })
    }
    else {
        arrow.x += arrow.vx * k; arrow.y += arrow.vy * k; arrow.vy += GRAV() * k; arrow.ang = Math.atan2(arrow.vy, arrow.vx);
        AR.position.set(arrow.x, arrow.y, 0); AR.rotation.z = arrow.ang;
        balloons.forEach(b => { if (b.alive && ((arrow.x - b.x) / (R * .88)) ** 2 + ((arrow.y - b.y) / (R * 1.05)) ** 2 < 1) pop(b) });
        if (arrow.y < -vh / 2 - 3 || Math.abs(arrow.x) > vw / 2 + 3 || arrow.y > vh / 2 + 6) arrow.state = 'idle'
    }
    for (let i = shards.length - 1; i >= 0; i--) {
        const m = shards[i], u = m.userData; m.position.x += u.vx * k; m.position.y += u.vy * k; m.position.z += u.vz * k; u.vy -= .003 * R * k; u.l -= .022 * k;
        m.scale.setScalar(Math.max(.001, R * .09 * u.l)); if (u.l <= 0) { G.s.remove(m); shards.splice(i, 1) }
    }
}

/* ---------- KADO 3D ---------- */
const gc = $('#gcv'), GS = mk(gc, 360, 360, 35, 7.4); GS.c.position.set(0, 1.4, 7.2); GS.c.lookAt(0, .15, 0);
const root = new THREE.Group(), lid = new THREE.Group(); GS.s.add(root);
const coral = phys('#FF6B4A', { roughness: .35, clearcoat: .6 }), coral2 = phys('#E0533A', { roughness: .35, clearcoat: .6 }), gold = phys('#F2BE4B', { roughness: .22 });
const rb = (w, h, d, m, r = .06) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 6, r), m);
root.add(rb(2, 1.5, 2, coral, .2), rb(.4, 1.54, 2.04, gold), rb(2.04, 1.54, .4, gold));
lid.add(rb(2.24, .5, 2.24, coral2, .2), rb(.4, .54, 2.28, gold), rb(2.28, .54, .4, gold)); lid.position.y = 1;
for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.38, .1, 20, 48), gold); t.scale.set(1, 1.25, .8); t.position.set(s * .4, .42, 0); t.rotation.set(0, 0, s * -.9); lid.add(t) }
const knot = new THREE.Mesh(new THREE.SphereGeometry(.17, 24, 18), gold); knot.position.set(0, .34, 0); lid.add(knot); root.add(lid);
const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sg = sc.getContext('2d'), gr = sg.createRadialGradient(64, 64, 4, 64, 64, 62);
gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.8; GS.s.add(shadow);
let taps = 0, shake = 0, lidV = null, gv = false;
new IntersectionObserver(e => gv = e[0].isIntersecting).observe(gc);
const dotsEl = $('#dots'); for (let i = 0; i < 5; i++)dotsEl.appendChild(document.createElement('i'));
gc.addEventListener('click', () => {
    if (taps >= 5) return; taps++; shake = 1; dotsEl.children[taps - 1].classList.add('f');
    $('#hint').textContent = taps < 5 ? 'Sisa ' + (5 - taps) + ' ketukan' : 'Terbuka!';
    if (taps === 5) setTimeout(() => {
        lidV = { y: .13, rx: .04, rz: .05 }; const r = gc.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height * .4;
        show(12, ox, oy, 260); setTimeout(() => show(7, null, null, 350), 1200); $('#rp').classList.add('show');
        setTimeout(() => $('#rp').scrollIntoView({ behavior: 'smooth', block: 'center' }), 500)
    }, 300)
});
function stepGift(t, k) {
    root.rotation.y = .6 + Math.sin(t * .8) * .2; root.position.y = Math.sin(t * 1.6) * .06;
    shake = Math.max(0, shake - .035 * k); root.rotation.z = Math.sin(t * 45) * .1 * shake; const q = 1 + .06 * shake; root.scale.set(q, 1 / q, q);
    if (lidV) { lid.position.y += lidV.y * k; lidV.y -= .004 * k; lid.rotation.x += lidV.rx * k; lid.rotation.z += lidV.rz * k; if (lid.position.y > 9) lid.visible = false }
}

/* ---------- loop ---------- */
let last = performance.now();
function tick(now) {
    const dt = Math.min((now - last) / 1000, .05); last = now; const k = dt * 60, t = now / 1000;
    if (on3) { stepGame(t, k); G.r.render(G.s, G.c) }
    if (gv) { stepGift(t, k); GS.r.render(GS.s, GS.c) }
    fxStep(k); requestAnimationFrame(tick)
}
requestAnimationFrame(tick);
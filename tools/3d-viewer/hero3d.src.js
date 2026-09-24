/*
 * AY-Tech – interaktiver 3D-Viewer für die Startseite
 * Quelle für website/assets/js/hero3d.js (Bundle mit esbuild, siehe README).
 * Bauteile werden wie auf der Drehmaschine aus Profilen erzeugt (LatheGeometry)
 * bzw. als Frästeile extrudiert. Keine externen Dateien, keine Server-Anfragen.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Color, Vector2, Box3, Vector3,
  PlaneGeometry, LatheGeometry, ExtrudeGeometry, Shape, Path,
  MeshBasicMaterial, MeshPhysicalMaterial, DirectionalLight, HemisphereLight,
  CanvasTexture, RepeatWrapping, PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, DoubleSide,
  CylinderGeometry, BoxGeometry, CircleGeometry, TorusGeometry, Plane, BufferGeometry, BufferAttribute,
  LineSegments, LineBasicMaterial, AdditiveBlending, Quaternion,
} from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';

/* ------------------------------------------------------------ Umgebung */
function studioEnv(renderer) {
  const s = new Scene();
  s.background = new Color(0x1a2636);
  const box = (w, h, pos, color, k) => {
    const m = new Mesh(new PlaneGeometry(w, h),
      new MeshBasicMaterial({ color: new Color(color).multiplyScalar(k), side: DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  box(12, 6, [0, 7, 1], 0xffffff, 3.2);
  box(3, 8, [-7, 2, 2], 0xf2f6ff, 2.6);
  box(3, 8, [7, 1.8, -1], 0xa9ccf5, 2.4);
  box(14, 2.4, [0, 1.6, -8], 0xffffff, 2.0);
  box(14, 1.6, [0, 0.8, 8], 0xdbe6f2, 1.4);
  const floor = new Mesh(new PlaneGeometry(60, 60), new MeshBasicMaterial({ color: 0x46566a }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3; s.add(floor);
  const pm = new PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.015).texture;
  pm.dispose();
  return tex;
}

function stripeTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 1024;
  const g = c.getContext('2d');
  for (let y = 0; y < c.height; y++) {
    const v = 128 + (Math.random() - 0.5) * 70 + Math.sin(y * 1.7) * 28;
    g.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`; g.fillRect(0, y, c.width, 1);
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; return t;
}

/* ------------------------------------------------------------ Geometrie */
function lathe(profile, seg = 128) {
  const parts = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const [r1, y1] = profile[i], [r2, y2] = profile[i + 1];
    if (r1 === r2 && y1 === y2) continue;
    const g = new LatheGeometry([new Vector2(r1, y1), new Vector2(r2, y2)], seg);
    const len = Math.hypot(r2 - r1, y2 - y1);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setY(k, uv.getY(k) * len / 40 + y1 / 40);
    parts.push(g);
  }
  return mergeGeometries(parts);
}
function thread(rOuter, rInner, y0, y1, pitch) {
  const pts = [];
  for (let y = y0; y < y1 - 1e-6; y += pitch) pts.push([rInner, y], [rOuter, y + pitch * 0.45], [rOuter, y + pitch * 0.55]);
  pts.push([rInner, y1]);
  return pts;
}
function extrude(shape, depth, bevel = 0.8) {
  const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 96 });
  return toCreasedNormals(g, Math.PI / 7);
}
function roundedRect(w, h, r, path = new Shape()) {
  const x = -w / 2, y = -h / 2;
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}
const circle = (cx, cy, r) => { const p = new Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; };

function buildParts() {
  const stripes = stripeTexture();
  const M = {
    steel: new MeshPhysicalMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.2, bumpMap: stripes, bumpScale: 0.35, envMapIntensity: 1.25 }),
    steelDark: new MeshPhysicalMaterial({ color: 0x9aa3ad, metalness: 1, roughness: 0.3 }),
    alu: new MeshPhysicalMaterial({ color: 0xeef1f4, metalness: 1, roughness: 0.3, envMapIntensity: 1.15 }),
    brass: new MeshPhysicalMaterial({ color: 0xe6bb66, metalness: 1, roughness: 0.22, bumpMap: stripes, bumpScale: 0.35, envMapIntensity: 1.2 }),
  };
  const mesh = (g, m) => new Mesh(g, m);

  const shaft = () => {
    const g = new Group();
    g.add(mesh(lathe([
      [0, 0], [9.2, 0], [10, 0.8], [10, 24], [13.2, 24], [14, 24.8], [14, 56],
      [12.4, 56], [12.4, 59.5], [14, 59.5], [14, 78], [19.2, 78], [20, 78.8], [20, 90], [19.2, 90.8],
      [12.6, 90.8], [12, 91.4], [12, 97], ...thread(12, 11.1, 97, 128, 1.5), [10.4, 128.8], [0, 128.8],
    ]), M.steel));
    const key = mesh(extrude(roundedRect(22, 6, 3), 1.2, 0.3), M.steelDark);
    key.rotation.set(0, 0, Math.PI / 2); key.position.set(0, 40, 13.2);
    g.add(key);
    g.rotation.z = Math.PI / 2;
    return g;
  };
  const flange = () => {
    const sh = new Shape(); sh.absarc(0, 0, 60, 0, Math.PI * 2, false);
    sh.holes.push(circle(0, 0, 15.5));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; sh.holes.push(circle(Math.cos(a) * 45, Math.sin(a) * 45, 5.6)); }
    const disc = mesh(extrude(sh, 12, 1.0), M.steel); disc.rotation.x = -Math.PI / 2; disc.position.y = 1;
    const hub = mesh(lathe([[15.5, 12], [30, 12], [30, 30], [29.2, 30.8], [16.3, 30.8], [15.5, 30], [15.5, 12]]), M.steel);
    const g = new Group(); g.add(disc, hub); g.rotation.x = 0.75; return g;
  };
  const housing = () => {
    const holes = [[-48, -28], [48, -28], [-48, 28], [48, 28]];
    const base = roundedRect(120, 80, 7); holes.forEach(([x, y]) => base.holes.push(circle(x, y, 3.6))); base.holes.push(circle(0, 0, 9));
    const frame = roundedRect(120, 80, 7); holes.forEach(([x, y]) => frame.holes.push(circle(x, y, 5.8)));
    frame.holes.push(roundedRect(76, 48, 8, new Path()));
    const b = mesh(extrude(base, 10, 0.6), M.alu); b.rotation.x = -Math.PI / 2; b.position.y = 0.6;
    const f = mesh(extrude(frame, 20, 0.8), M.alu); f.rotation.x = -Math.PI / 2; f.position.y = 11;
    const g = new Group(); g.add(b, f); g.rotation.x = 0.65; return g;
  };
  const adapter = () => {
    const hex = new Shape();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, x = Math.cos(a) * 18.5, y = Math.sin(a) * 18.5; i ? hex.lineTo(x, y) : hex.moveTo(x, y); }
    hex.closePath(); hex.holes.push(circle(0, 0, 6));
    const h = mesh(extrude(hex, 14, 1.2), M.brass); h.rotation.x = -Math.PI / 2; h.position.y = 17.2;
    const top = mesh(lathe([[6, 32], [10.6, 32], [11, 32.6], ...thread(11, 10.1, 33, 46, 1.5), [9.6, 46.8], [6, 46.8]]), M.brass);
    const bottom = mesh(lathe([[6, 0], [8.2, 0], [9, 0.8], ...thread(9, 8.2, 1, 12, 1.25), [9, 12], [12, 12], [12, 16], [6, 16]]), M.brass);
    const g = new Group(); g.add(h, top, bottom); g.rotation.x = 0.35; return g;
  };
  return { shaft, flange, housing, adapter };
}

/* Bauteil zentrieren und auf einheitliche Größe bringen */
function normalize(obj, size = 118) {
  const wrap = new Group(); wrap.add(obj);
  const box = new Box3().setFromObject(obj);
  const c = box.getCenter(new Vector3());
  obj.position.sub(c);
  const r = box.getSize(new Vector3()).length() / 2;
  wrap.scale.setScalar(size / r);
  return wrap;
}

/* Weicher Bodenschatten */
function contactShadow() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const m = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.scale.set(260, 120, 1); m.position.y = -122;
  return m;
}

const ease = (t) => 1 - Math.pow(1 - t, 3);

/* ------------------------------------------------------------ Viewer */
export function initViewer(root, { reducedMotion = false } = {}) {
  const canvas = root.querySelector('canvas');
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.environment = studioEnv(renderer);
  const camera = new PerspectiveCamera(30, 1, 1, 3000);
  camera.position.set(0, 40, 430); camera.lookAt(0, 0, 0);
  const key = new DirectionalLight(0xffffff, 2.6); key.position.set(160, 260, 220); scene.add(key);
  const rim = new DirectionalLight(0x9cc4ff, 1.8); rim.position.set(-260, 120, -220); scene.add(rim);
  scene.add(new HemisphereLight(0xdfe8f5, 0x0b1624, 0.35));
  scene.add(contactShadow());

  const builders = buildParts();
  const cache = {};
  const tiltG = new Group(); scene.add(tiltG);
  const holder = new Group(); holder.rotation.x = 0.18; tiltG.add(holder);
  const dro = root.querySelector('[data-dro]');
  let curYaw = 0, curPitch = 0;
  const hero = root.closest('.hero') || root;
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      curYaw = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
      curPitch = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
    });
    hero.addEventListener('pointerleave', () => { curYaw = 0; curPitch = 0; });
  }
  let current = null, currentName = null;

  const tabs = [...root.querySelectorAll('[data-part]')];
  const info = root.querySelector('[data-viewer-info]');

  // Animationszustand
  let velY = reducedMotion ? 0 : 0.006, velX = 0, targetTiltX = 0.18;
  let dragging = false, lastX = 0, lastY = 0, downX = 0, downY = 0, lastInteract = 0;
  let swap = null; // { from, to, t }

  function show(name, animate = true) {
    if (name === currentName) return;
    if (swap) { // laufenden Wechsel sofort abschließen
      holder.remove(swap.from); swap.from.scale.setScalar(swap.from.userData.s);
      swap.to.scale.setScalar(swap.to.userData.s); swap = null;
    }
    const next = cache[name] || (cache[name] = normalize(builders[name]()));
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.part === name)));
    const tab = tabs.find((t) => t.dataset.part === name);
    if (info && tab) info.innerHTML = `<strong>${tab.dataset.title}</strong><span>${tab.dataset.desc}</span>`;
    if (!current || !animate || reducedMotion) {
      if (current) holder.remove(current);
      holder.add(next); next.scale.setScalar(next.userData.s || next.scale.x); current = next;
    } else {
      swap = { from: current, to: next, t: 0 };
      next.userData.s = next.userData.s || next.scale.x;
      next.scale.setScalar(0.001); holder.add(next);
      velY += 0.25;
    }
    current = next; currentName = name;
  }
  cache.shaft = normalize(builders.shaft());
  show('shaft', false);

  tabs.forEach((t) => t.addEventListener('click', () => show(t.dataset.part)));

  // Ziehen zum Drehen, Tippen für Schwung
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = downX = e.clientX; lastY = downY = e.clientY; lastInteract = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    velY = dx * 0.006; velX = dy * 0.004;
    holder.rotation.y += dx * 0.01;
    targetTiltX = Math.max(-0.6, Math.min(0.9, targetTiltX + dy * 0.006));
    lastInteract = performance.now();
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) velY += 0.35; // Klick = Schwung
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  // Größe
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 1 ? 520 : 430;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Nur rendern, wenn sichtbar
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(root);

  let t0 = performance.now();
  function frame(now) {
    const dt = Math.min(50, now - t0) / 16.67; t0 = now;
    if (visible && !document.hidden) {
      if (!dragging) {
        holder.rotation.y += velY * dt;
        const idle = reducedMotion ? 0 : 0.006;
        velY += (idle - velY) * 0.03 * dt;
        velX *= 0.9;
      }
      holder.rotation.x += (targetTiltX - holder.rotation.x) * 0.08 * dt;
      tiltG.rotation.y += (curYaw - tiltG.rotation.y) * 0.05 * dt;
      tiltG.rotation.x += (curPitch - tiltG.rotation.x) * 0.05 * dt;
      if (dro) {
        const c = ((holder.rotation.y * 180 / Math.PI) % 360 + 360) % 360;
        dro.textContent = 'C ' + c.toFixed(1).padStart(5, '0') + '°  ·  B ' + (holder.rotation.x * 180 / Math.PI).toFixed(1) + '°';
      }
      if (!reducedMotion) holder.position.y = Math.sin(now / 900) * 4;
      if (swap) {
        swap.t = Math.min(1, swap.t + 0.045 * dt);
        const k = ease(swap.t);
        swap.from.scale.setScalar(swap.from.userData.s * Math.max(0.001, 1 - k * 1.6));
        swap.to.scale.setScalar(swap.to.userData.s * Math.max(0.001, Math.min(1, (k - 0.25) / 0.75)));
        if (swap.t >= 1) { holder.remove(swap.from); swap.from.scale.setScalar(swap.from.userData.s); swap = null; }
      }
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  cache.shaft.userData.s = cache.shaft.scale.x;
  requestAnimationFrame(frame);
  root.classList.add('is-3d');
}


/* ================================================================
 * Scroll-Story: „Vom Rohling zum Präzisionsteil“
 * Fortschritt kommt aus main.js (root.dataset.progress, 0…1).
 * ================================================================ */
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

const SHAFT_PROFILE = [
  [0, 0], [9.2, 0], [10, 0.8], [10, 24], [13.2, 24], [14, 24.8], [14, 56],
  [12.4, 56], [12.4, 59.5], [14, 59.5], [14, 78], [19.2, 78], [20, 78.8], [20, 90], [19.2, 90.8],
  [12.6, 90.8], [12, 91.4], [12, 97], ...thread(12, 11.1, 97, 128, 1.5), [10.4, 128.8], [0, 128.8],
];
const HALF = 64.4; // halbe Wellenlänge → Welle liegt von x = -64,4 bis +64,4

function radiusAt(y) {
  let r = 0;
  for (let i = 0; i < SHAFT_PROFILE.length - 1; i++) {
    const [r1, y1] = SHAFT_PROFILE[i], [r2, y2] = SHAFT_PROFILE[i + 1];
    if (y1 === y2) { if (Math.abs(y - y1) < 0.01) r = Math.max(r, r1, r2); continue; }
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    if (y >= lo && y <= hi) r = Math.max(r, lerp(r1, r2, (y - y1) / (y2 - y1)));
  }
  return r;
}

export function initStory(root, { reducedMotion = false } = {}) {
  const canvas = root.querySelector('.story-canvas');
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.localClippingEnabled = true;

  const scene = new Scene();
  scene.environment = studioEnv(renderer);
  const camera = new PerspectiveCamera(28, 1, 1, 3000);
  const key = new DirectionalLight(0xffffff, 2.6); key.position.set(160, 260, 220); scene.add(key);
  const rim = new DirectionalLight(0x9cc4ff, 1.8); rim.position.set(-260, 120, -220); scene.add(rim);
  scene.add(new HemisphereLight(0xdfe8f5, 0x0b1624, 0.35));

  // Schnittebenen (Weltkoordinaten)
  const cutPlane = new Plane(new Vector3(1, 0, 0), 0);    // fertiges Teil: x >= Werkzeug
  const stockPlane = new Plane(new Vector3(-1, 0, 0), 0); // Rohling: x <= Werkzeug
  const slotPlane = new Plane(new Vector3(-1, 0, 0), 0);  // Nut: x <= Fräser

  const stripes = stripeTexture();
  const matPart = new MeshPhysicalMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.2, bumpMap: stripes, bumpScale: 0.35, envMapIntensity: 1.25, clippingPlanes: [cutPlane], side: DoubleSide });
  const matStock = new MeshPhysicalMaterial({ color: 0x8d969f, metalness: 0.9, roughness: 0.55, clippingPlanes: [stockPlane] });
  const matCap = new MeshPhysicalMaterial({ color: 0x9aa3ad, metalness: 0.9, roughness: 0.35, bumpMap: stripes, bumpScale: 0.2 });
  const matSlot = new MeshPhysicalMaterial({ color: 0x2a2f36, metalness: 0.8, roughness: 0.5, clippingPlanes: [slotPlane] });
  const matDark = new MeshPhysicalMaterial({ color: 0x3a4048, metalness: 0.85, roughness: 0.35 });
  const matChuck = new MeshPhysicalMaterial({ color: 0x5f6873, metalness: 0.9, roughness: 0.3 });
  const matInsert = new MeshPhysicalMaterial({ color: 0xffb13d, metalness: 0.7, roughness: 0.25, emissive: 0x2a1000 });

  // Welle (liegend, Achse = Welt-X) in drehbarer Gruppe
  const display = new Group(); scene.add(display);
  const axis = new Group(); axis.rotation.z = -Math.PI / 2; axis.position.x = -HALF; display.add(axis);
  const spin = new Group(); axis.add(spin);
  spin.add(new Mesh(lathe(SHAFT_PROFILE, 160), matPart));
  const slot = new Mesh(extrude(roundedRect(22, 6, 3), 1.2, 0.3), matSlot);
  slot.rotation.set(0, 0, Math.PI / 2); slot.position.set(0, 40, 12.9); spin.add(slot);

  // Rohling + Spannfutter
  const stock = new Mesh(new CylinderGeometry(21.5, 21.5, 143, 96, 1, false), matStock);
  stock.position.y = 59.5; spin.add(stock);
  const cap = new Mesh(new CircleGeometry(21.5, 96), matCap); cap.rotation.y = Math.PI / 2; scene.add(cap);
  const chuck = new Group();
  const body = new Mesh(new CylinderGeometry(36, 36, 26, 96), matChuck); body.position.y = -25; chuck.add(body);
  for (let i = 0; i < 3; i++) {
    const j = new Mesh(new BoxGeometry(11, 18, 10), matDark);
    const a = i * Math.PI * 2 / 3;
    j.position.set(Math.sin(a) * 26.5, -6, Math.cos(a) * 26.5); j.rotation.y = a; chuck.add(j);
  }
  spin.add(chuck);

  // Drehmeißel (Spitze im Ursprung, Halter nach unten)
  const tool = new Group();
  const tri = new Shape(); tri.moveTo(0, 0); tri.lineTo(-6, -9); tri.lineTo(6, -9); tri.closePath();
  const insert = new Mesh(new ExtrudeGeometry(tri, { depth: 5, bevelEnabled: false }), matInsert); insert.position.z = -2.5; tool.add(insert);
  const shank = new Mesh(new BoxGeometry(12, 60, 14), matDark); shank.position.y = -39; tool.add(shank);
  scene.add(tool);

  // Schaftfräser
  const mill = new Group();
  const cutter = new Mesh(new CylinderGeometry(3, 3, 26, 32), new MeshPhysicalMaterial({ color: 0xcfd6dd, metalness: 1, roughness: 0.25, bumpMap: stripes, bumpScale: 0.5 }));
  cutter.position.y = 13; mill.add(cutter);
  const collet = new Mesh(new CylinderGeometry(8, 6, 26, 48), matDark); collet.position.y = 39; mill.add(collet);
  scene.add(mill);

  // Messring
  const ring = new Mesh(new TorusGeometry(27, 0.9, 16, 128), new MeshBasicMaterial({ color: 0x8ab9e6, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false }));
  ring.rotation.y = Math.PI / 2; scene.add(ring);

  // Funken (Liniensegmente, additiv)
  const N = 360;
  const pos = new Float32Array(N * 6), col = new Float32Array(N * 6);
  const P = Array.from({ length: N }, () => ({ life: 0 }));
  const sparkGeo = new BufferGeometry();
  sparkGeo.setAttribute('position', new BufferAttribute(pos, 3));
  sparkGeo.setAttribute('color', new BufferAttribute(col, 3));
  const sparks = new LineSegments(sparkGeo, new LineBasicMaterial({ vertexColors: true, transparent: true, blending: AdditiveBlending, depthWrite: false }));
  sparks.frustumCulled = false; scene.add(sparks);
  let next = 0;
  const emit = (x, y, z, n, up = false) => {
    for (let i = 0; i < n; i++) {
      const p = P[next]; next = (next + 1) % N;
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.2;
      p.x = x; p.y = y; p.z = z;
      p.vx = Math.cos(a) * sp * 0.8; p.vz = Math.abs(Math.sin(a)) * sp + 0.4;
      p.vy = up ? Math.random() * 2.2 + 0.4 : -Math.random() * 1.6 + 0.6;
      p.life = 1; p.decay = 0.018 + Math.random() * 0.03;
    }
  };
  const updateSparks = (dt) => {
    for (let i = 0; i < N; i++) {
      const p = P[i], o = i * 6;
      if (p.life > 0) {
        p.vy -= 0.09 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= p.decay * dt;
        if (p.y < -75) p.life = 0;
        const k = Math.max(0, p.life);
        pos[o] = p.x; pos[o + 1] = p.y; pos[o + 2] = p.z;
        pos[o + 3] = p.x - p.vx * 2.2; pos[o + 4] = p.y - p.vy * 2.2; pos[o + 5] = p.z - p.vz * 2.2;
        col[o] = 1 * k; col[o + 1] = (0.55 + 0.35 * k) * k; col[o + 2] = 0.15 * k * k;
        col[o + 3] = 0.6 * k; col[o + 4] = 0.25 * k; col[o + 5] = 0;
      } else { col.fill(0, o, o + 6); }
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.color.needsUpdate = true;
  };

  // Maßbeschriftungen (HTML) mit Ankerpunkten in Weltkoordinaten
  const labels = [...root.querySelectorAll('[data-anchor]')].map((el) => {
    const [x, y, z] = el.dataset.anchor.split(',').map(Number);
    return { el, v: new Vector3(x, y, z) };
  });
  const stage = root.querySelector('.story-stage');
  const tmp = new Vector3();

  // Größe
  let baseDist = 300;
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    baseDist = 300 * Math.max(1, 1.45 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let visible = false;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '100px' }).observe(root);

  const KEY_ANGLE = -Math.PI / 2; // Nut zeigt nach oben (Fräser arbeitet senkrecht)
  let p = 0, spinAngle = 0, lastToolX = 99, lastMillX = -99, t0 = performance.now();
  const n = new Vector3(0, -Math.sin(KEY_ANGLE), Math.cos(KEY_ANGLE)); // Normale der Nut (Welt)
  mill.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), n));

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(50, now - t0) / 16.67; t0 = now;
    if (!visible || document.hidden) return;
    const target = parseFloat(root.dataset.progress || '0');
    p += (target - p) * Math.min(1, 0.14 * dt);

    // Kamera: beim Fräsen von oben, sonst leicht erhöht von vorn
    const high = smooth(seg(p, 0.5, 0.56)) - smooth(seg(p, 0.72, 0.78));
    camera.position.set(0, lerp(62, 175, high), baseDist * lerp(1, 0.78, high));
    camera.lookAt(0, lerp(-6, 0, high), 0);

    // 1) Drehen
    const approach = seg(p, 0.06, 0.1);
    const tTurn = smooth(seg(p, 0.1, 0.5));
    const toolX = lerp(70, -66, tTurn);
    cutPlane.constant = -toolX;
    stockPlane.constant = toolX;
    const turning = p > 0.1 && p < 0.5;
    const r = radiusAt(toolX + HALF);
    const retract = 1 - approach + seg(p, 0.5, 0.54);
    tool.position.set(Math.min(toolX, 66), -Math.max(r, 12) - 0.3 - retract * 30, 0);
    tool.visible = p < 0.56;
    cap.position.x = toolX; cap.visible = toolX > -64.5 && toolX < 66.5;
    if (turning && Math.abs(toolX - lastToolX) > 0.02) emit(toolX, -r, 0.5, Math.min(14, 2 + Math.abs(toolX - lastToolX) * 6));
    lastToolX = toolX;

    // Spannfutter fährt nach dem Drehen weg
    const out = smooth(seg(p, 0.5, 0.56));
    chuck.position.y = -out * 60; chuck.visible = out < 0.99;
    stock.visible = p < 0.56;

    // Drehung der Welle: schnell beim Drehen, dann auf Nut-Position einrasten
    if (p < 0.5) spinAngle += 0.32 * dt * (turning ? 1 : 0.15);
    else {
      const k = smooth(seg(p, 0.5, 0.55));
      const keyTarget = lerp(KEY_ANGLE, -0.35, smooth(seg(p, 0.74, 0.84))); // zum Schluss Nut zur Kamera
      const base = Math.round((spinAngle - keyTarget) / (Math.PI * 2)) * Math.PI * 2 + keyTarget;
      spinAngle = lerp(spinAngle, base, Math.min(1, 0.1 * dt + k * 0.4));
    }
    spin.rotation.y = spinAngle;

    // 2) Fräsen (Nut von x = -35,4 bis -13,4)
    const mDown = smooth(seg(p, 0.54, 0.58));
    const mMove = smooth(seg(p, 0.58, 0.68));
    const mUp = smooth(seg(p, 0.68, 0.72));
    const millX = lerp(-35.4 + 3, -13.4 - 3, mMove);
    slotPlane.constant = p < 0.58 ? -99 : millX + 3;
    const surf = new Vector3(millX, 0, 0).addScaledVector(n, 14.1);
    const off = (1 - mDown) * 45 + mUp * 50;
    mill.position.copy(surf).addScaledVector(n, off);
    mill.visible = p > 0.52 && p < 0.74;
    cutter.rotation.y += 0.6 * dt;
    if (p > 0.58 && p < 0.68 && Math.abs(millX - lastMillX) > 0.02) emit(surf.x, surf.y, surf.z, Math.min(10, 2 + Math.abs(millX - lastMillX) * 8), true);
    lastMillX = millX;

    // 3) Prüfen: Messring fährt über die Welle
    const tMeas = smooth(seg(p, 0.72, 0.86));
    ring.position.x = lerp(-72, 72, tMeas);
    ring.visible = p > 0.71 && p < 0.9;
    ring.material.opacity = 0.9 * (1 - seg(p, 0.86, 0.9));

    // 4) Fertig: Teil präsentiert sich
    const fin = smooth(seg(p, 0.86, 1));
    display.rotation.y = fin * 0.55 + (reducedMotion ? 0 : Math.sin(now / 1400) * 0.04 * fin);
    display.rotation.x = fin * 0.2;
    display.position.y = fin * 8;

    updateSparks(dt);
    renderer.render(scene, camera);

    // Beschriftungen positionieren
    const w = canvas.clientWidth, h = canvas.clientHeight;
    labels.forEach((l) => {
      tmp.copy(l.v).applyMatrix4(display.matrixWorld).project(camera);
      l.el.style.transform = `translate(${((tmp.x + 1) / 2 * w).toFixed(1)}px, ${((1 - tmp.y) / 2 * h).toFixed(1)}px)`;
      l.el.classList.toggle('is-on', p > 0.72 && (ring.position.x > l.v.x || p > 0.86));
    });
    if (stage) stage.style.setProperty('--tool', ((toolX + 70) / 136).toFixed(3));
  }
  requestAnimationFrame(frame);
  root.classList.add('is-3d');
}

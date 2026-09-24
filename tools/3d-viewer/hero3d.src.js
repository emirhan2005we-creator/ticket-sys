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
  const warm = new DirectionalLight(0xff9a4a, 0.25); warm.position.set(240, -60, 120); scene.add(warm);
  scene.add(new HemisphereLight(0xdfe8f5, 0x0b1624, 0.35));
  scene.add(contactShadow());

  const builders = buildParts();
  const cache = {};
  const holder = new Group(); holder.rotation.x = 0.18; scene.add(holder);
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

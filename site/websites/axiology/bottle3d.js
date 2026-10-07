/* =============================================================================
   AXIOLOGY — Three.js 3D Bottle Showcase
   Cylindrical bottle (glass body + amber oil core + dark cap) on a dark
   stage, rotating slowly with cursor interaction. Uses MeshPhysicalMaterial
   for transmission-style glass. No post-FX (kept lightweight).

   Loaded as an ES module (Three.js classic build was deprecated in r150+).
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';

// ES modules have their own scope — no IIFE needed.
const canvas = document.querySelector('[data-bottle3d-canvas]');
if (canvas) (() => {
  'use strict';

  const stage = canvas.parentElement;

  // ---------- Renderer ---------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // ---------- Scene ------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = null; // CSS gradient shows through

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.8, 6.4);
  camera.lookAt(0, 0, 0);

  // ---------- Lighting ---------------------------------------------------
  scene.add(new THREE.AmbientLight(0xfff1e0, 0.45));

  const keyLight = new THREE.DirectionalLight(0xfff0c8, 1.6);
  keyLight.position.set(3, 4, 4);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xc9952f, 1.4);
  rimLight.position.set(-3, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0xfad58a, 0.8, 12);
  fillLight.position.set(0, -1, 3);
  scene.add(fillLight);

  // ---------- Bottle group ----------------------------------------------
  const bottle = new THREE.Group();
  scene.add(bottle);

  // GLASS BODY — frosted amber, transmission-based
  const bodyGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.2, 64, 1, false);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffd47a,
    metalness: 0.0,
    roughness: 0.08,
    transmission: 0.92,
    thickness: 0.6,
    ior: 1.45,
    attenuationColor: new THREE.Color(0xc28a3c),
    attenuationDistance: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.1
  });
  const body = new THREE.Mesh(bodyGeo, glassMat);
  bottle.add(body);

  // AMBER OIL CORE — slightly smaller inner cylinder, emissive
  const oilGeo = new THREE.CylinderGeometry(0.76, 0.76, 1.95, 64, 1, false);
  const oilMat = new THREE.MeshStandardMaterial({
    color: 0x8a4a14,
    emissive: 0x4a2206,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.05
  });
  const oil = new THREE.Mesh(oilGeo, oilMat);
  oil.position.y = -0.05;
  bottle.add(oil);

  // SHOULDER — small cone narrowing to cap
  const shoulderGeo = new THREE.CylinderGeometry(0.42, 0.85, 0.45, 64);
  const shoulder = new THREE.Mesh(shoulderGeo, glassMat);
  shoulder.position.y = 1.32;
  bottle.add(shoulder);

  // NECK
  const neckGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.42, 32);
  const neck = new THREE.Mesh(neckGeo, glassMat);
  neck.position.y = 1.74;
  bottle.add(neck);

  // CAP — dark walnut-look
  const capGeo = new THREE.CylinderGeometry(0.36, 0.34, 0.5, 32);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x2a1610,
    metalness: 0.5,
    roughness: 0.35
  });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 2.18;
  bottle.add(cap);

  // CAP TIP — tiny dropper detail
  const tipGeo = new THREE.ConeGeometry(0.18, 0.32, 24);
  const tip = new THREE.Mesh(tipGeo, capMat);
  tip.position.y = 2.55;
  bottle.add(tip);

  // LABEL — wrapped flat plane on front face
  const labelTex = makeLabelTexture();
  const labelGeo = new THREE.PlaneGeometry(1.5, 1.05, 1, 1);
  const labelMat = new THREE.MeshStandardMaterial({
    map: labelTex,
    transparent: true,
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, -0.05, 0.86);
  bottle.add(label);

  // BASE RING — soft golden ring underneath for grounding
  const ringGeo = new THREE.RingGeometry(0.95, 1.6, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc9952f,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -1.15;
  scene.add(ring);

  // FLOATING RESIN CHUNKS — small instanced particles
  const resinGroup = new THREE.Group();
  const resinGeo = new THREE.IcosahedronGeometry(0.08, 0);
  const resinMat = new THREE.MeshStandardMaterial({
    color: 0xc9952f,
    emissive: 0x4a2206,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    metalness: 0.2
  });
  const resinPieces = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(resinGeo, resinMat);
    const a = (i / 14) * Math.PI * 2;
    const r = 2.4 + Math.random() * 0.6;
    m.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 2.4, Math.sin(a) * r);
    m.scale.setScalar(0.6 + Math.random() * 0.9);
    m.userData = { a, r, speed: 0.0008 + Math.random() * 0.0014, baseY: m.position.y, phase: Math.random() * Math.PI * 2 };
    resinPieces.push(m);
    resinGroup.add(m);
  }
  scene.add(resinGroup);

  // ---------- Generate label texture programmatically -------------------
  function makeLabelTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 360;
    const x = c.getContext('2d');

    // Cream label background
    x.fillStyle = '#FBEFE0';
    x.fillRect(0, 0, c.width, c.height);

    // Subtle border
    x.strokeStyle = '#7B1F30';
    x.lineWidth = 3;
    x.strokeRect(18, 18, c.width - 36, c.height - 36);

    // Brand mark — italic serif
    x.fillStyle = '#7B1F30';
    x.font = 'italic 600 56px Fraunces, Georgia, serif';
    x.textAlign = 'center';
    x.fillText('Axiology', c.width / 2, 100);

    x.font = '500 16px "Inter", sans-serif';
    x.fillStyle = '#5A6135';
    x.fillText('cosmetics', c.width / 2, 128);

    // Divider
    x.beginPath();
    x.moveTo(c.width / 2 - 60, 160);
    x.lineTo(c.width / 2 + 60, 160);
    x.strokeStyle = '#7B1F30';
    x.lineWidth = 1;
    x.stroke();

    // Product
    x.font = '500 38px "Inter", sans-serif';
    x.fillStyle = '#1C1410';
    x.fillText('FRANKINCENSE', c.width / 2, 210);
    x.fillText('& MYRRH', c.width / 2, 252);

    x.font = '400 18px Fraunces, serif';
    x.fillStyle = '#7B1F30';
    x.fillText('Pure essential oil  ·  50 ml', c.width / 2, 296);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    return tex;
  }

  // ---------- Resize handling -------------------------------------------
  function resize() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // ---------- Cursor / drag interaction --------------------------------
  const target = { ry: 0, rx: 0 };
  const cur    = { ry: 0, rx: 0 };
  let dragging = false;
  let dragStart = null;
  let dragBaseRy = 0;

  stage.addEventListener('mousemove', (e) => {
    if (dragging) return;
    const r = stage.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width  - 0.5) * 2;
    const py = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    target.ry = px * 0.7 + autoSpin;
    target.rx = -py * 0.25;
  });

  stage.addEventListener('mousedown', (e) => {
    dragging = true;
    dragStart = e.clientX;
    dragBaseRy = bottle.rotation.y;
    stage.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', () => {
    dragging = false;
    stage.style.cursor = '';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart;
    target.ry = dragBaseRy + dx * 0.008;
  });

  // Touch
  stage.addEventListener('touchstart', (e) => {
    dragging = true;
    dragStart = e.touches[0].clientX;
    dragBaseRy = bottle.rotation.y;
  }, { passive: true });
  window.addEventListener('touchend', () => { dragging = false; });
  window.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const dx = e.touches[0].clientX - dragStart;
    target.ry = dragBaseRy + dx * 0.008;
  }, { passive: true });

  // ---------- Pause when off-screen (perf) -----------------------------
  let inView = true;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
    }, { rootMargin: '120px' });
    io.observe(stage);
  }

  // ---------- Animate ---------------------------------------------------
  let autoSpin = 0;
  const t0 = performance.now();
  function tick() {
    if (!inView) { requestAnimationFrame(tick); return; }
    const t = (performance.now() - t0) / 1000;
    autoSpin += 0.003; // continuous slow rotation
    if (!dragging) target.ry += 0.003;

    cur.ry += (target.ry - cur.ry) * 0.08;
    cur.rx += (target.rx - cur.rx) * 0.08;
    bottle.rotation.y = cur.ry;
    bottle.rotation.x = cur.rx;
    bottle.position.y = Math.sin(t * 0.7) * 0.06;

    // Orbit resin pieces
    resinPieces.forEach((m, i) => {
      const d = m.userData;
      d.a += d.speed;
      m.position.x = Math.cos(d.a) * d.r;
      m.position.z = Math.sin(d.a) * d.r;
      m.position.y = d.baseY + Math.sin(t * 0.8 + d.phase) * 0.3;
      m.rotation.x = t * 0.4 + i;
      m.rotation.y = t * 0.6 + i;
    });

    // Subtle ring breathing
    ring.material.opacity = 0.22 + Math.sin(t * 1.4) * 0.06;
    ring.scale.setScalar(1 + Math.sin(t * 0.9) * 0.04);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
})();

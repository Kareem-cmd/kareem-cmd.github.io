/* ════════════════════════════════════════════════════════════════
   CHAMELO — Three.js Hero Scene (The Hunt Map)
   ──────────────────────────────────────────────────────────────
   Renders:
     - Dotted strategic grid (custom shader)
     - Red mouse-tracking hot-spot
     - Chameleon mark plane (textured, breathing, parallax)
     - Faint ambient particles
   Exposes:
     window.ChameloHero = { mount, mouse, update, ... }
   ════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('[ChameloHero] THREE.js not loaded');
    return;
  }

  const ChameloHero = {
    scene: null,
    camera: null,
    renderer: null,
    mount: null,
    grid: null,
    chameleon: null,
    particles: null,
    clock: new THREE.Clock(),
    mouse: { x: 0, y: 0, smoothX: 0, smoothY: 0 },
    target: { gridScale: 1.0, chameleonScale: 1.0 },
    state: { ready: false, paused: false },
    uniforms: {},

    init(mountEl) {
      this.mount = mountEl;
      if (!mountEl) return;

      const { clientWidth: w, clientHeight: h } = mountEl;

      // Scene + Camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      this.camera.position.z = 10;

      // Renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(w, h);
      this.renderer.setClearColor(0x0a0a0a, 1);
      mountEl.appendChild(this.renderer.domElement);

      // Build scene elements
      this._buildGrid();
      this._buildChameleon();
      this._buildParticles();

      // Listeners
      window.addEventListener('resize', this._onResize.bind(this));
      window.addEventListener('mousemove', this._onMouseMove.bind(this));

      // Pause on tab blur
      document.addEventListener('visibilitychange', () => {
        this.state.paused = document.hidden;
      });

      this.state.ready = true;
      this._animate();
    },

    // ┌─ Dotted Grid Shader ─────────────────────────────────────┐
    _buildGrid() {
      const geometry = new THREE.PlaneGeometry(40, 24, 1, 1);

      this.uniforms.grid = {
        uTime:      { value: 0 },
        uOpacity:   { value: 0.0 },          // GSAP animates to 0.22
        uScale:     { value: 1.0 },          // ScrollTrigger animates to 2.5
        uColor:     { value: new THREE.Color('#d6cfc0') },
      };

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: this.uniforms.grid,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uTime;
          uniform float uOpacity;
          uniform float uScale;
          uniform vec3  uColor;
          varying vec2 vUv;

          void main() {
            // Aspect-correct uvs so cells stay square
            vec2 uv = vUv;
            uv.x *= 1.67;
            uv *= uScale;

            // Cell coordinates
            float cellSize = 28.0;
            vec2 cell = uv * cellSize;
            vec2 cellPos = fract(cell) - 0.5;

            // Distance to nearest cell center
            float d = length(cellPos);

            // Soft, even dot — no animation, no flicker, no hotspot
            float dotSize = 0.075;
            float dot = 1.0 - smoothstep(dotSize, dotSize + 0.03, d);

            float alpha = dot * uOpacity;

            gl_FragColor = vec4(uColor, alpha);
          }
        `
      });

      this.grid = new THREE.Mesh(geometry, material);
      this.grid.position.z = -2;
      this.scene.add(this.grid);
    },

    // ┌─ Chameleon plane (textured) ─────────────────────────────┐
    _buildChameleon() {
      const loader = new THREE.TextureLoader();
      // We use logo-mark.png (transparent red chameleon head)
      const texture = loader.load('assets/logo-mark.png', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
      });
      texture.anisotropy = 4;

      const geometry = new THREE.PlaneGeometry(3.1, 3.1, 1, 1);

      this.uniforms.chameleon = {
        uMap:     { value: texture },
        uOpacity: { value: 0.0 },
        uTime:    { value: 0 },
        uGlow:    { value: 0.0 }   // kept for legacy compatibility; no longer used visually
      };

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: this.uniforms.chameleon,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform sampler2D uMap;
          uniform float uOpacity;
          varying vec2 vUv;

          void main() {
            vec4 tex = texture2D(uMap, vUv);
            // Clean stamp look — no halo, no pulse, no glow.
            gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
          }
        `
      });

      this.chameleon = new THREE.Mesh(geometry, material);
      // Position to the right side of the screen (matches moodboard)
      this.chameleon.position.set(2.2, 0, -0.5);
      this.scene.add(this.chameleon);

      // ── Eye pupils (track mouse) ───────────────────────────
      // Two small dark circles overlaid on the chameleon's eye sockets.
      // Position is RELATIVE to the chameleon plane (3.1×3.1 units).
      // From visual inspection of logo-mark.png:
      //   Left eye  ≈ ( -0.55,  +0.18 ) of chameleon plane
      //   Right eye ≈ ( +0.55,  +0.18 ) of chameleon plane
      // pupil radius ≈ 0.06 in world units, socket radius ≈ 0.18
      this.eyes = this._buildEyes(this.chameleon.position);
    },

    // ┌─ Eye pupils that follow the mouse ───────────────────────┐
    _buildEyes(chamCenter) {
      const eyeGroup = new THREE.Group();
      this.scene.add(eyeGroup);

      const pupilGeom = new THREE.CircleGeometry(0.07, 32);
      const pupilMat = new THREE.MeshBasicMaterial({
        color: 0x0a0a0a,
        transparent: true,
        opacity: 0
      });

      // Anchor offsets in the chameleon's local plane (world units, NOT UV)
      // chameleon plane is 3.1 wide; eye centers approx at ±28% from center.
      const anchorLeft  = { x: -0.62, y:  0.22 };
      const anchorRight = { x:  0.62, y:  0.22 };
      const sceneZ = chamCenter.z + 0.01;

      const left  = new THREE.Mesh(pupilGeom, pupilMat.clone());
      const right = new THREE.Mesh(pupilGeom, pupilMat.clone());

      left.position.set(chamCenter.x + anchorLeft.x,  chamCenter.y + anchorLeft.y,  sceneZ);
      right.position.set(chamCenter.x + anchorRight.x, chamCenter.y + anchorRight.y, sceneZ);

      eyeGroup.add(left);
      eyeGroup.add(right);

      return {
        group: eyeGroup,
        left, right,
        anchorLeft:  new THREE.Vector2(chamCenter.x + anchorLeft.x,  chamCenter.y + anchorLeft.y),
        anchorRight: new THREE.Vector2(chamCenter.x + anchorRight.x, chamCenter.y + anchorRight.y),
        sceneZ,
        maxOffset: 0.10,           // max distance pupils can stray from socket center
        opacity:   0,              // GSAP fades this to 1 with the chameleon
      };
    },

    // ┌─ Particles ─────────────────────────────────────────────┐
    _buildParticles() {
      const count = 120;
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const seeds = new Float32Array(count);

      for (let i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 28;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
        sizes[i]  = 1.5 + Math.random() * 3.5;
        seeds[i]  = Math.random() * 100;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aSeed',    new THREE.BufferAttribute(seeds, 1));

      this.uniforms.particles = {
        uTime:    { value: 0 },
        uOpacity: { value: 0.0 },
        uPxRatio: { value: this.renderer.getPixelRatio() }
      };

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: this.uniforms.particles,
        vertexShader: `
          attribute float aSize;
          attribute float aSeed;
          uniform float uTime;
          uniform float uPxRatio;
          varying float vSeed;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.15 + aSeed) * 0.6;
            p.y += cos(uTime * 0.18 + aSeed * 1.4) * 0.4;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * uPxRatio * (300.0 / -mv.z);
            vSeed = aSeed;
          }
        `,
        fragmentShader: `
          precision highp float;
          uniform float uTime;
          uniform float uOpacity;
          varying float vSeed;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float alpha = smoothstep(0.5, 0.0, d);
            float flicker = sin(uTime * 1.5 + vSeed) * 0.3 + 0.7;
            gl_FragColor = vec4(0.82, 0.13, 0.11, alpha * flicker * 0.55 * uOpacity);
          }
        `
      });

      this.particles = new THREE.Points(geometry, material);
      this.particles.position.z = -1.5;
      this.scene.add(this.particles);
    },

    // ┌─ Mouse tracking ─────────────────────────────────────────┐
    _onMouseMove(e) {
      // Normalized -0.5 to 0.5
      this.mouse.x = (e.clientX / window.innerWidth) - 0.5;
      this.mouse.y = (e.clientY / window.innerHeight) - 0.5;
    },

    _onResize() {
      if (!this.mount) return;
      const { clientWidth: w, clientHeight: h } = this.mount;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    },

    // ┌─ Animate ────────────────────────────────────────────────┐
    _animate() {
      if (this.state.paused) {
        requestAnimationFrame(this._animate.bind(this));
        return;
      }
      const t = this.clock.getElapsedTime();

      // Smooth mouse follow
      this.mouse.smoothX += (this.mouse.x - this.mouse.smoothX) * 0.06;
      this.mouse.smoothY += (this.mouse.y - this.mouse.smoothY) * 0.06;

      // Update grid uniforms
      if (this.uniforms.grid) {
        this.uniforms.grid.uTime.value = t;
        this.grid.scale.setScalar(this.uniforms.grid.uScale.value);
      }

      // Chameleon parallax + breathing
      if (this.chameleon) {
        this.uniforms.chameleon.uTime.value = t;
        this.chameleon.rotation.y =  this.mouse.smoothX * 0.18;
        this.chameleon.rotation.x = -this.mouse.smoothY * 0.12;
        // Breathing scale via sin
        const breath = 1 + Math.sin(t * 0.9) * 0.015;
        const baseScale = this.target.chameleonScale;
        this.chameleon.scale.setScalar(breath * baseScale);
      }

      // Eye pupils — gaze toward mouse, constrained to socket
      if (this.eyes) {
        const eyes = this.eyes;
        // mouse.smoothX/Y are normalized -0.5..0.5 (already smoothed)
        // Translate into a 0..1 gaze magnitude, then clamp to maxOffset.
        const gx = this.mouse.smoothX * 2.0;   // -1..1
        const gy = -this.mouse.smoothY * 2.0;  // flip Y for world space
        const len = Math.min(Math.sqrt(gx*gx + gy*gy), 1);
        const angle = Math.atan2(gy, gx);
        const ox = Math.cos(angle) * eyes.maxOffset * len;
        const oy = Math.sin(angle) * eyes.maxOffset * len;

        eyes.left.position.x  = eyes.anchorLeft.x  + ox;
        eyes.left.position.y  = eyes.anchorLeft.y  + oy;
        eyes.right.position.x = eyes.anchorRight.x + ox;
        eyes.right.position.y = eyes.anchorRight.y + oy;

        // Fade in with the chameleon (driven externally via .opacity)
        eyes.left.material.opacity  = eyes.opacity;
        eyes.right.material.opacity = eyes.opacity;
      }

      // Particles
      if (this.uniforms.particles) {
        this.uniforms.particles.uTime.value = t;
      }

      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this._animate.bind(this));
    }
  };

  window.ChameloHero = ChameloHero;
})();

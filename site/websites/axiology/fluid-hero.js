/* =============================================================================
   AXIOLOGY — WebGL Liquid Hero
   Renders the hero source image as a texture and distorts it with a
   cursor-driven sin-wave ripple + slow ambient breathing. Falls back gracefully.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.querySelector('[data-hero-canvas]');
  const source = document.querySelector('[data-hero-source]');
  if (!canvas || !source) return;

  // ---------- WebGL bootstrap ----------------------------------------------
  const gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false });
  if (!gl) {
    // Graceful degradation: just show the image
    source.style.opacity = 1;
    canvas.style.display = 'none';
    return;
  }

  const VS = `
    attribute vec2 a_position;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main(){
      v_uv = a_uv;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FS = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform float u_time;
    uniform vec2 u_mouse;          // 0..1
    uniform vec2 u_mouseTarget;    // smoothed
    uniform float u_aspect;
    uniform vec2 u_resolution;
    uniform float u_texAspect;

    // cover-fit the texture so it never stretches
    vec2 coverUV(vec2 uv, float canvasAspect, float texAspect){
      vec2 cuv = uv;
      if (canvasAspect > texAspect) {
        // canvas is wider — clamp Y
        float scale = texAspect / canvasAspect;
        cuv.y = (uv.y - 0.5) * scale + 0.5;
      } else {
        float scale = canvasAspect / texAspect;
        cuv.x = (uv.x - 0.5) * scale + 0.5;
      }
      return cuv;
    }

    void main(){
      vec2 uv = coverUV(v_uv, u_aspect, u_texAspect);

      // ambient breathing ripple — slow, low amplitude, persistent
      float t = u_time * 0.7;
      float ambient = sin( (uv.x * 12.0) + t ) * 0.0024
                    + cos( (uv.y * 16.0) - t * 1.3) * 0.0020;

      // mouse-driven ripple — concentric waves around the cursor
      vec2 mouse = u_mouseTarget;
      vec2 toM   = uv - mouse;
      float dist = length(toM);
      float wave = sin( dist * 40.0 - u_time * 3.5 ) * exp(-dist * 5.0);
      vec2 ripple = normalize(toM + 0.0001) * wave * 0.010;

      // light parallax: shift uv by mouse relative to center
      vec2 parallax = (mouse - 0.5) * 0.018;

      vec2 finalUV = uv - parallax + ripple + vec2(ambient, ambient * 0.6);

      vec4 col = texture2D(u_tex, finalUV);

      // subtle warm color grade — pull shadows toward wine, highlights toward gold
      vec3 warmShadow = vec3(0.29, 0.08, 0.14); // wine
      vec3 warmHigh   = vec3(1.00, 0.86, 0.55); // gold
      float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
      vec3 graded = mix(col.rgb, warmShadow, smoothstep(0.0, 0.18, 1.0 - lum) * 0.10);
      graded = mix(graded, warmHigh, smoothstep(0.65, 0.95, lum) * 0.06);

      // soft vignette
      float vig = smoothstep(0.95, 0.35, length(v_uv - 0.5));
      graded *= mix(0.78, 1.0, vig);

      // film grain
      float grain = fract(sin(dot(v_uv * u_resolution, vec2(12.9898, 78.233))) * 43758.5453);
      graded += (grain - 0.5) * 0.020;

      gl_FragColor = vec4(graded, 1.0);
    }
  `;

  function makeShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = makeShader(gl.VERTEX_SHADER, VS);
  const fs = makeShader(gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(prog));
    source.style.opacity = 1;
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  // fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    // position    uv
    -1, -1,        0, 0,
     1, -1,        1, 0,
    -1,  1,        0, 1,
    -1,  1,        0, 1,
     1, -1,        1, 0,
     1,  1,        1, 1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_position');
  const aUV  = gl.getAttribLocation(prog, 'a_uv');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

  // uniforms
  const uTime       = gl.getUniformLocation(prog, 'u_time');
  const uMouse      = gl.getUniformLocation(prog, 'u_mouse');
  const uMouseT     = gl.getUniformLocation(prog, 'u_mouseTarget');
  const uAspect     = gl.getUniformLocation(prog, 'u_aspect');
  const uTexAspect  = gl.getUniformLocation(prog, 'u_texAspect');
  const uResolution = gl.getUniformLocation(prog, 'u_resolution');

  // texture
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 14, 8, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let texAspect = 16 / 9;
  let ready = false;
  function uploadImage(img) {
    try {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      texAspect = img.naturalWidth / img.naturalHeight;
      ready = true;
      canvas.classList.add('is-ready');
    } catch (e) {
      // Tainted canvas / CORS — fail soft: hide canvas so source img is visible
      console.warn('hero texture upload failed:', e);
      canvas.style.display = 'none';
    }
  }

  if (source.complete && source.naturalWidth) {
    uploadImage(source);
  } else {
    source.addEventListener('load', () => uploadImage(source));
    source.addEventListener('error', () => { canvas.style.display = 'none'; });
  }

  // resize
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.floor(rect.width  * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  // mouse
  const mouse        = { x: 0.5, y: 0.5 };
  const mouseTarget  = { x: 0.5, y: 0.5 };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (e.clientY < rect.top || e.clientY > rect.bottom) return;
    mouseTarget.x = (e.clientX - rect.left) / rect.width;
    mouseTarget.y = 1 - (e.clientY - rect.top) / rect.height;
  });

  // render
  const t0 = performance.now();
  function frame() {
    // smooth mouse
    mouse.x += (mouseTarget.x - mouse.x) * 0.08;
    mouse.y += (mouseTarget.y - mouse.y) * 0.08;

    const t = (performance.now() - t0) / 1000;

    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouseTarget.x, mouseTarget.y);
    gl.uniform2f(uMouseT, mouse.x, mouse.y);
    gl.uniform1f(uAspect, canvas.width / canvas.height);
    gl.uniform1f(uTexAspect, texAspect);
    gl.uniform2f(uResolution, canvas.width, canvas.height);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

(function (global) {
  'use strict';

  const LED_PALETTE = [
    '#ff4040', '#ffe44d', '#6dff70', '#4fb4ff',
    '#ff62d8', '#67fff5', '#ff9a3c', '#ffffff',
  ];

  const FONT_STACKS = {
    orbitron: '900 1px "Orbitron", sans-serif',
    bebas: '900 1px "Bebas Neue", sans-serif',
    rubik: '900 1px "Rubik", sans-serif',
    mono: '900 1px "SFMono-Regular", Consolas, monospace',
    digital: '900 1px "Share Tech Mono", monospace',
    pacifico: '900 1px "Pacifico", cursive',
  };

  function clamp(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function hexToRgb(hex) {
    const value = String(hex || '#ffffff').replace('#', '');
    if (value.length !== 6) return { r: 255, g: 255, b: 255 };
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }

  function rgbToString(rgb, alpha = 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function pingPong(t, length) {
    const v = t % (length * 2);
    return v <= length ? v : (length * 2) - v;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function hashNoise(seed) {
    const x = Math.sin(seed * 127.1) * 43758.5453123;
    return x - Math.floor(x);
  }

  function getFontStack(name) {
    const raw = FONT_STACKS[name] || FONT_STACKS.orbitron;
    return raw.replace('1px ', '');
  }

  class LedMatrixEngine {
    constructor(root, options = {}) {
      this.root = root;
      this.options = options;
      this.panel = root.querySelector('.sign-panel');
      this.track = root.querySelector('.sign-track');
      this.textNode = root.querySelector('.sign-text');
      this.canvas = this.panel.querySelector('.matrix-canvas') || document.createElement('canvas');
      this.canvas.className = 'matrix-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      if (!this.canvas.parentNode) {
        this.panel.appendChild(this.canvas);
      }
      this.ctx = this.canvas.getContext('2d', { alpha: true });
      this.offscreen = document.createElement('canvas');
      this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: true });
      this.reflectionCanvas = document.createElement('canvas');
      this.reflectionCtx = this.reflectionCanvas.getContext('2d');
      this.running = false;
      this.paused = false;
      this.pauseStartedAt = 0;
      this.pausedElapsed = 0;
      this.startedAt = performance.now();
      this.lastConfigKey = '';
      this.currentConfig = null;
      this.lastTimestamp = performance.now();
      this.frameRequest = null;
      this.resizeObserver = null;
      this.ensureObservers();
      this.resize();
    }

    ensureObservers() {
      if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.panel);
      }
    }

    resize() {
      const rect = this.panel.getBoundingClientRect();
      const width = Math.max(10, Math.round(rect.width));
      const height = Math.max(10, Math.round(rect.height));
      const dpr = Math.max(1, global.devicePixelRatio || 1);
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      this.reflectionCanvas.width = width;
      this.reflectionCanvas.height = height;
      if (this.currentConfig && this.currentConfig.render_mode === 'matrix_scene') {
        this.drawFrame(this.getElapsedSeconds(performance.now()));
      }
    }

    getElapsedSeconds(timestamp) {
      if (this.paused) {
        return this.pausedElapsed;
      }
      return Math.max(0, (timestamp - this.startedAt) / 1000);
    }

    setPaused(shouldPause) {
      const next = Boolean(shouldPause);
      if (this.paused === next) return;
      this.paused = next;
      if (next) {
        this.pauseStartedAt = performance.now();
        this.pausedElapsed = this.getElapsedSeconds(this.pauseStartedAt);
      } else {
        const now = performance.now();
        const pauseSpan = now - this.pauseStartedAt;
        this.startedAt += pauseSpan;
      }
    }

    stop() {
      this.running = false;
      if (this.frameRequest) cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
      this.canvas.style.display = 'none';
      this.panel.classList.remove('matrix-scene-active');
      if (this.track) this.track.style.display = '';
      if (this.textNode) this.textNode.style.display = '';
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(config) {
      const normalized = this.normalizeConfig(config);
      this.currentConfig = normalized;
      if (normalized.render_mode !== 'matrix_scene') {
        this.stop();
        return false;
      }

      const nextKey = JSON.stringify(normalized);
      if (nextKey !== this.lastConfigKey) {
        this.lastConfigKey = nextKey;
        this.startedAt = performance.now();
        this.pausedElapsed = 0;
      }

      this.panel.classList.add('matrix-scene-active');
      this.canvas.style.display = 'block';
      if (this.track) this.track.style.display = 'none';
      if (this.textNode) this.textNode.style.display = 'none';
      this.resize();

      if (!this.running) {
        this.running = true;
        this.loop();
      }
      return true;
    }

    loop() {
      if (!this.running) return;
      this.frameRequest = requestAnimationFrame((ts) => {
        if (this.currentConfig && this.currentConfig.render_mode === 'matrix_scene') {
          this.drawFrame(this.getElapsedSeconds(ts));
        }
        this.loop();
      });
    }

    normalizeConfig(config) {
      const safe = config || {};
      return {
        render_mode: safe.render_mode || 'text',
        matrix_scene: safe.matrix_scene || 'custom_banner',
        matrix_cols: clamp(safe.matrix_cols, 32, 128, 64),
        matrix_rows: clamp(safe.matrix_rows, 12, 40, 20),
        matrix_reflection: Boolean(safe.matrix_reflection),
        matrix_show_stars: safe.matrix_show_stars === undefined ? true : Boolean(safe.matrix_show_stars),
        matrix_panel_gloss: safe.matrix_panel_gloss === undefined ? true : Boolean(safe.matrix_panel_gloss),
        scene_icon_left: String(safe.scene_icon_left || ''),
        scene_icon_right: String(safe.scene_icon_right || ''),
        message: String(safe.message || 'HELLO LED'),
        style: String(safe.style || 'literal_led'),
        animation_mode: String(safe.animation_mode || 'marquee'),
        direction: String(safe.direction || 'left'),
        font_family: String(safe.font_family || 'orbitron'),
        text_color: String(safe.text_color || '#ff4040'),
        accent_color: String(safe.accent_color || '#4fb4ff'),
        background_color: String(safe.background_color || '#050505'),
        brightness: clamp(safe.brightness, 30, 180, 100),
        glow: clamp(safe.glow, 0, 100, 80),
        speed: clamp(safe.speed, 4, 60, 18),
        multi_color: Boolean(safe.multi_color),
        uppercase: Boolean(safe.uppercase),
      };
    }

    getBoardMetrics(config) {
      const width = Math.max(10, this.panel.clientWidth);
      const height = Math.max(10, this.panel.clientHeight);
      const outerPadX = Math.max(14, width * 0.03);
      const outerPadTop = Math.max(12, height * 0.07);
      const outerPadBottom = config.matrix_reflection ? Math.max(28, height * 0.24) : Math.max(14, height * 0.08);
      const usableWidth = width - outerPadX * 2;
      const usableHeight = height - outerPadTop - outerPadBottom;
      const cell = Math.min(usableWidth / config.matrix_cols, usableHeight / config.matrix_rows);
      const boardWidth = cell * config.matrix_cols;
      const boardHeight = cell * config.matrix_rows;
      const boardX = (width - boardWidth) / 2;
      const boardY = outerPadTop + (usableHeight - boardHeight) / 2;
      return { width, height, cell, boardWidth, boardHeight, boardX, boardY };
    }

    clearCanvas(width, height, config) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = config.background_color;
      ctx.fillRect(0, 0, width, height);

      const bg = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.4, Math.max(width, height));
      bg.addColorStop(0, 'rgba(255,255,255,0.04)');
      bg.addColorStop(0.45, 'rgba(255,255,255,0.01)');
      bg.addColorStop(1, 'rgba(0,0,0,0.0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }

    drawBackdrop(metrics, config, time) {
      const ctx = this.ctx;
      const { boardX, boardY, boardWidth, boardHeight, cell, width, height } = metrics;

      const frameGradient = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardHeight);
      frameGradient.addColorStop(0, 'rgba(255,255,255,0.14)');
      frameGradient.addColorStop(0.08, 'rgba(255,255,255,0.03)');
      frameGradient.addColorStop(1, 'rgba(255,255,255,0.06)');

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.68)';
      ctx.strokeStyle = frameGradient;
      ctx.lineWidth = Math.max(1.5, cell * 0.25);
      this.roundRect(ctx, boardX - cell * 0.8, boardY - cell * 0.8, boardWidth + cell * 1.6, boardHeight + cell * 1.6, Math.max(6, cell * 0.9));
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      if (config.matrix_panel_gloss) {
        const gloss = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardHeight * 0.7);
        gloss.addColorStop(0, 'rgba(255,255,255,0.09)');
        gloss.addColorStop(0.18, 'rgba(255,255,255,0.03)');
        gloss.addColorStop(0.45, 'rgba(255,255,255,0)');
        ctx.fillStyle = gloss;
        this.roundRect(ctx, boardX, boardY, boardWidth, boardHeight * 0.5, Math.max(4, cell * 0.8));
        ctx.fill();
      }

      if (config.matrix_show_stars) {
        for (let i = 0; i < 16; i += 1) {
          const sx = lerp(width * 0.05, width * 0.95, hashNoise(i * 11.33));
          const sy = lerp(height * 0.04, boardY - 6, hashNoise(i * 7.61 + 3.2));
          const twinkle = 0.22 + 0.78 * Math.abs(Math.sin(time * 1.5 + i));
          ctx.fillStyle = `rgba(255,255,255,${0.05 + twinkle * 0.18})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.7, cell * 0.08 + twinkle * cell * 0.04), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawInactiveGrid(metrics) {
      const ctx = this.ctx;
      const { boardX, boardY, boardWidth, boardHeight, cell } = metrics;
      const radius = Math.max(1.2, cell * 0.16);
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let y = 0; y < this.currentConfig.matrix_rows; y += 1) {
        for (let x = 0; x < this.currentConfig.matrix_cols; x += 1) {
          const cx = boardX + x * cell + cell * 0.5;
          const cy = boardY + y * cell + cell * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const vignette = ctx.createLinearGradient(boardX, boardY, boardX, boardY + boardHeight);
      vignette.addColorStop(0, 'rgba(255,255,255,0.02)');
      vignette.addColorStop(0.5, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = vignette;
      this.roundRect(ctx, boardX, boardY, boardWidth, boardHeight, Math.max(4, cell * 0.75));
      ctx.fill();
    }

    drawFrame(time) {
      const config = this.currentConfig;
      if (!config) return;
      const metrics = this.getBoardMetrics(config);
      this.clearCanvas(metrics.width, metrics.height, config);
      this.drawBackdrop(metrics, config, time);
      this.drawInactiveGrid(metrics);

      const buffer = new Map();
      const ctx = this.ctx;

      switch (config.matrix_scene) {
        case 'eyes':
          this.sceneEyes(buffer, config, time);
          break;
        case 'hearts':
          this.sceneHearts(buffer, config, time);
          break;
        case 'festive':
          this.sceneFestive(buffer, config, time);
          break;
        case 'stop_bus':
          this.sceneStopBus(buffer, config, time);
          break;
        case 'arrow_text':
          this.sceneArrowText(buffer, config, time);
          break;
        case 'emoji_parade':
          this.sceneEmojiParade(buffer, config, time);
          break;
        case 'custom_banner':
        default:
          this.sceneCustomBanner(buffer, config, time);
          break;
      }

      this.drawBuffer(buffer, metrics, false);
      if (config.matrix_reflection) {
        this.drawBuffer(buffer, metrics, true);
      }

      // subtle floor glow
      if (config.matrix_reflection) {
        const floorGradient = ctx.createLinearGradient(0, metrics.boardY + metrics.boardHeight + 8, 0, metrics.height);
        floorGradient.addColorStop(0, 'rgba(255,255,255,0.06)');
        floorGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = floorGradient;
        ctx.fillRect(metrics.boardX, metrics.boardY + metrics.boardHeight + 6, metrics.boardWidth, metrics.height - metrics.boardY - metrics.boardHeight);
      }
    }

    setPixel(buffer, x, y, color, alpha = 1, size = 1) {
      const cols = this.currentConfig.matrix_cols;
      const rows = this.currentConfig.matrix_rows;
      if (x < 0 || y < 0 || x >= cols || y >= rows) return;
      const key = `${x},${y}`;
      const current = buffer.get(key);
      if (!current || alpha >= current.alpha) {
        buffer.set(key, { x, y, color, alpha, size });
      }
    }

    drawBuffer(buffer, metrics, reflection = false) {
      const ctx = this.ctx;
      const { boardX, boardY, cell, boardHeight } = metrics;
      const glowGain = 0.55 + (this.currentConfig.glow / 100) * 1.2;
      const brightGain = this.currentConfig.brightness / 100;

      for (const pixel of buffer.values()) {
        const px = boardX + pixel.x * cell + cell * 0.5;
        const py = boardY + pixel.y * cell + cell * 0.5;
        const rgb = hexToRgb(pixel.color);
        const alpha = reflection ? pixel.alpha * 0.2 * (1 - pixel.y / Math.max(1, this.currentConfig.matrix_rows)) : pixel.alpha;
        if (alpha <= 0.02) continue;

        let drawX = px;
        let drawY = py;
        let scaleY = 1;
        if (reflection) {
          drawY = boardY + boardHeight + 16 + (this.currentConfig.matrix_rows - pixel.y) * cell * 0.42;
          scaleY = 0.7;
        }

        const radius = Math.max(1.4, cell * 0.22 * pixel.size);
        const glow = Math.max(2, cell * 1.15 * glowGain * pixel.size);
        ctx.save();
        ctx.shadowBlur = reflection ? glow * 0.6 : glow;
        ctx.shadowColor = rgbToString(rgb, Math.min(0.95, alpha * 0.9));
        ctx.fillStyle = rgbToString(rgb, Math.min(1, alpha * brightGain));
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, radius, Math.max(1.2, radius * scaleY), 0, 0, Math.PI * 2);
        ctx.fill();

        const coreGradient = ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, Math.max(1.4, radius * 2.2));
        coreGradient.addColorStop(0, rgbToString({ r: 255, g: 255, b: 255 }, Math.min(0.95, alpha * 0.95)));
        coreGradient.addColorStop(0.22, rgbToString(rgb, Math.min(0.96, alpha * 0.95)));
        coreGradient.addColorStop(1, rgbToString(rgb, 0));
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.ellipse(drawX, drawY, radius * 2.1, Math.max(1.2, radius * 2.1 * scaleY), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    sceneCustomBanner(buffer, config, time) {
      const segments = this.buildSegments(config.message, config, false);
      this.drawSegmentsToBuffer(buffer, segments, config, {
        time,
        fontScale: 0.68,
        yRatio: 0.56,
        gap: 0.05,
      });
    }

    sceneEmojiParade(buffer, config, time) {
      const left = config.scene_icon_left || '👾';
      const right = config.scene_icon_right || '✨';
      const message = config.message || 'HELLO';
      const segments = [
        { text: left, color: config.accent_color },
        ...this.buildSegments(message, config, true),
        { text: right, color: '#67fff5' },
      ];
      this.drawSegmentsToBuffer(buffer, segments, config, {
        time,
        fontScale: 0.64,
        yRatio: 0.52 + Math.sin(time * 2.2) * 0.02,
        gap: 0.06,
      });
    }

    sceneFestive(buffer, config, time) {
      const left = config.scene_icon_left || '🎅';
      const right = config.scene_icon_right || '🎄';
      const message = config.message || 'HO HO!';
      const segments = [
        { text: left, color: '#ff5d5d' },
        ...this.buildSegments(message, config, true),
        { text: right, color: '#6dff70' },
      ];
      this.drawSegmentsToBuffer(buffer, segments, config, {
        time,
        fontScale: 0.58,
        yRatio: 0.62,
        gap: 0.05,
      });

      for (let i = 0; i < 18; i += 1) {
        const sx = Math.floor(hashNoise(i * 17.17) * this.currentConfig.matrix_cols);
        const sy = Math.floor((time * (1.4 + hashNoise(i * 6.7) * 0.8) * 3 + i * 1.7) % this.currentConfig.matrix_rows);
        const sparkle = 0.28 + 0.72 * Math.abs(Math.sin(time * 3.2 + i * 0.7));
        this.setPixel(buffer, sx, sy, LED_PALETTE[i % LED_PALETTE.length], sparkle, 0.9);
      }
    }

    sceneStopBus(buffer, config, time) {
      const bounce = Math.sin(time * 4) * 0.03;
      const segments = [
        ...this.buildSegments(config.message || 'STOP!!', config, false),
        { text: '🚌', color: config.accent_color || '#4fb4ff' },
      ];
      this.drawSegmentsToBuffer(buffer, segments, config, {
        time,
        fontScale: 0.62,
        yRatio: 0.55 + bounce,
        gap: 0.05,
      });
    }

    sceneArrowText(buffer, config, time) {
      const arrow = config.direction === 'right' ? '➡️' : '⬅️';
      const pulse = 0.5 + 0.5 * Math.sin(time * 5.4);
      const arrowColor = pulse > 0.5 ? config.accent_color : '#ffe44d';
      const segments = [
        { text: arrow, color: arrowColor },
        ...this.buildSegments(config.message || 'OFERTA', config, false),
      ];
      this.drawSegmentsToBuffer(buffer, segments, config, {
        time,
        fontScale: 0.62,
        yRatio: 0.54,
        gap: 0.06,
      });
    }

    sceneEyes(buffer, config, time) {
      const cols = config.matrix_cols;
      const rows = config.matrix_rows;
      const blinkWave = Math.pow((Math.sin(time * 0.9) + 1) / 2, 24);
      const eyeOpen = 1 - blinkWave * 0.9;
      const lookBase = config.direction === 'right' ? 1 : -1;
      const look = Math.sin(time * 1.7) * 2.1 * lookBase;
      const leftCx = cols * 0.3;
      const rightCx = cols * 0.7;
      const cy = rows * 0.55;
      this.drawEye(buffer, leftCx, cy, 10.5, 5.2 * eyeOpen + 0.8, look, config.text_color, '#ffd27a');
      this.drawEye(buffer, rightCx, cy, 10.5, 5.2 * eyeOpen + 0.8, look, config.text_color, '#ffd27a');

      const emberY = Math.floor(rows * 0.82);
      for (let x = 8; x < cols - 8; x += 1) {
        const sway = Math.sin(time * 2.8 + x * 0.25);
        const alpha = 0.1 + Math.max(0, sway) * 0.22;
        this.setPixel(buffer, x, emberY, '#ff5d35', alpha, 0.75);
      }
    }

    drawEye(buffer, cx, cy, rx, ry, lookOffset, irisColor, glowColor) {
      const cols = this.currentConfig.matrix_cols;
      const rows = this.currentConfig.matrix_rows;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = (x - cx) / rx;
          const ny = (y - cy) / Math.max(0.9, ry);
          const d = nx * nx + ny * ny;
          if (d <= 1.05) {
            const rim = 1 - Math.min(1, Math.abs(d - 0.85) / 0.25);
            const alpha = d > 0.88 ? 0.4 + rim * 0.4 : 0.7;
            this.setPixel(buffer, x, y, glowColor, alpha, 1.05);
          }
        }
      }

      const pupilX = cx + lookOffset;
      const pupilY = cy;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const d = ((x - pupilX) / 2.3) ** 2 + ((y - pupilY) / 2.3) ** 2;
          if (d <= 1.1) {
            this.setPixel(buffer, x, y, irisColor, 0.95, 1.2);
          }
        }
      }

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const lid = Math.abs((x - cx) / rx);
          const lidTop = cy - ry + lid * 2.6;
          const lidBottom = cy + ry - lid * 2.4;
          if (y < lidTop || y > lidBottom) {
            const key = `${x},${y}`;
            if (buffer.has(key)) {
              buffer.delete(key);
            }
          }
        }
      }
    }

    sceneHearts(buffer, config, time) {
      const centers = [
        { x: this.currentConfig.matrix_cols * 0.24, color: config.text_color || '#ff4040', phase: 0 },
        { x: this.currentConfig.matrix_cols * 0.5, color: '#ff62d8', phase: 0.8 },
        { x: this.currentConfig.matrix_cols * 0.76, color: '#67fff5', phase: 1.6 },
      ];
      const cy = this.currentConfig.matrix_rows * 0.47;
      for (const heart of centers) {
        const pulse = 0.88 + 0.18 * easeInOutSine((Math.sin(time * 2.7 + heart.phase) + 1) / 2);
        this.drawHeart(buffer, heart.x, cy, 4.6 * pulse, heart.color);
      }
      for (let x = 4; x < this.currentConfig.matrix_cols - 4; x += 1) {
        const alpha = 0.12 + 0.18 * Math.max(0, Math.sin(time * 5 + x * 0.35));
        this.setPixel(buffer, x, Math.floor(this.currentConfig.matrix_rows * 0.5), '#ffb15a', alpha, 0.75);
      }
    }

    drawHeart(buffer, cx, cy, scale, color) {
      const cols = this.currentConfig.matrix_cols;
      const rows = this.currentConfig.matrix_rows;
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const nx = (x - cx) / scale;
          const ny = (y - cy) / scale;
          const value = (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny * ny * ny;
          if (value <= 0) {
            this.setPixel(buffer, x, y, color, 0.95, 1.05);
          }
        }
      }
    }

    buildSegments(message, config, keepCase) {
      const source = keepCase ? String(message || '') : String(message || '');
      const normalized = config.uppercase ? source.toUpperCase() : source;
      const parts = normalized.split('|').filter((p) => p.length > 0);
      if (!parts.length) {
        return [{ text: normalized || 'LED', color: config.text_color }];
      }
      if (!config.multi_color || parts.length === 1) {
        return [{ text: parts.join(' '), color: config.text_color }];
      }
      return parts.map((part, index) => ({
        text: part.trim(),
        color: LED_PALETTE[index % LED_PALETTE.length],
      }));
    }

    drawSegmentsToBuffer(buffer, segments, config, options = {}) {
      const cols = this.currentConfig.matrix_cols;
      const rows = this.currentConfig.matrix_rows;
      const scale = 12;
      const width = cols * scale;
      const height = rows * scale;
      this.offscreen.width = width;
      this.offscreen.height = height;
      const ctx = this.offCtx;
      ctx.clearRect(0, 0, width, height);
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.imageSmoothingEnabled = true;
      ctx.lineJoin = 'round';

      const fontScale = options.fontScale || 0.66;
      const fontSize = Math.max(24, Math.floor(rows * scale * fontScale));
      const fontFamily = getFontStack(config.font_family);
      ctx.font = `900 ${fontSize}px ${fontFamily}`;

      const gapPx = Math.max(8, Math.round(width * (options.gap || 0.04)));
      const parts = segments.map((segment) => ({
        ...segment,
        width: Math.max(1, ctx.measureText(segment.text).width),
      }));
      const contentWidth = parts.reduce((sum, item) => sum + item.width, 0) + gapPx * Math.max(0, parts.length - 1);
      const travel = Math.max(0, contentWidth - width * 0.78);
      const speedFactor = clamp(config.speed / 18, 0.5, 3.5, 1);
      const y = height * (options.yRatio || 0.55);
      let x = (width - contentWidth) / 2;

      if (config.animation_mode === 'marquee') {
        const span = width + contentWidth + gapPx * 3;
        const progress = (options.time || 0) * speedFactor * 28;
        const shift = progress % span;
        x = config.direction === 'right'
          ? -contentWidth - gapPx + shift
          : width - shift;
      } else if (config.animation_mode === 'bounce') {
        const range = Math.max(0, width - contentWidth - width * 0.08);
        const bounce = pingPong((options.time || 0) * speedFactor * 20, Math.max(1, range));
        x = config.direction === 'right'
          ? width * 0.04 + bounce
          : width - contentWidth - width * 0.04 - bounce;
      }

      parts.forEach((segment, index) => {
        ctx.fillStyle = segment.color;
        ctx.shadowBlur = Math.max(4, fontSize * 0.18);
        ctx.shadowColor = segment.color;
        ctx.fillText(segment.text, x, y);
        if (config.glow > 35) {
          ctx.globalAlpha = 0.4;
          ctx.fillText(segment.text, x, y);
          ctx.globalAlpha = 1;
        }
        x += segment.width + (index < parts.length - 1 ? gapPx : 0);
      });

      const image = ctx.getImageData(0, 0, width, height).data;
      for (let gy = 0; gy < rows; gy += 1) {
        for (let gx = 0; gx < cols; gx += 1) {
          const sx = Math.min(width - 1, Math.floor(gx * scale + scale * 0.5));
          const sy = Math.min(height - 1, Math.floor(gy * scale + scale * 0.5));
          const idx = (sy * width + sx) * 4;
          const alpha = image[idx + 3] / 255;
          if (alpha <= 0.05) continue;
          const color = this.rgbToHex(image[idx], image[idx + 1], image[idx + 2]);
          this.setPixel(buffer, gx, gy, color, Math.min(1, alpha * 1.1), 1.0);
        }
      }
    }

    rgbToHex(r, g, b) {
      return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')}`;
    }

    roundRect(ctx, x, y, width, height, radius) {
      const r = Math.min(radius, width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + width, y, x + width, y + height, r);
      ctx.arcTo(x + width, y + height, x, y + height, r);
      ctx.arcTo(x, y + height, x, y, r);
      ctx.arcTo(x, y, x + width, y, r);
      ctx.closePath();
    }
  }

  global.MatrixSignEngine = LedMatrixEngine;
})(window);

/* =====================================================
   LED SIGN STUDIO v2.0 - display.js
   ===================================================== */

const stage    = document.getElementById("display-stage");
const textNode = document.getElementById("sign-text-display");
const toolbar  = document.getElementById("display-toolbar");
const btnFullscreen = document.getElementById("btn-display-fullscreen");
const btnPause = document.getElementById("btn-toggle-pause");
const btnReset = document.getElementById("btn-reset-motion");

let paused = false;
const matrixEngine = window.MatrixSignEngine ? new window.MatrixSignEngine(stage, { display: true }) : null;

const LED_PALETTE = [
    '#ff2222','#ffff00','#22ff55','#2299ff',
    '#ff22cc','#22ffee','#ff8800','#ffffff',
];

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
function hexToRgba(hex, alpha = 1) {
    const v = (hex || "#ffffff").replace("#", "");
    if (v.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(v.substring(0, 2), 16);
    const g = parseInt(v.substring(2, 4), 16);
    const b = parseInt(v.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function escapeHtmlChars(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getFontFamily(fontFamily) {
    switch (fontFamily) {
        case "bebas":    return '"Bebas Neue", sans-serif';
        case "rubik":    return '"Rubik", sans-serif';
        case "mono":     return '"SFMono-Regular", Consolas, monospace';
        case "digital":  return '"Share Tech Mono", monospace';
        case "pacifico": return '"Pacifico", cursive';
        case "orbitron":
        default:         return '"Orbitron", sans-serif';
    }
}

function buildColoredHTML(message, config, glow) {
    if (!config.multi_color) return escapeHtmlChars(message);
    const parts = message.split('|').filter(p => p.length > 0);
    if (parts.length <= 1) return escapeHtmlChars(message);

    return parts.map((part, i) => {
        const color = LED_PALETTE[i % LED_PALETTE.length];
        const g = hexToRgba(color, Math.min(0.95, 0.35 + glow / 80));
        const shadow = glow > 0
            ? `text-shadow:0 0 8px ${g},0 0 22px ${g},0 0 44px ${g};`
            : '';
        return `<span class="phrase-chunk" style="color:${color};${shadow}">${escapeHtmlChars(part.trim())}</span>`;
    }).join('<span style="color:rgba(255,255,255,0.15);margin:0 6px;">·</span>');
}

function applyThemeClasses(root, styleName) {
    const themes = ["neon","led","literal-led","lcd","billboard","minimal","pixel","plasma","retro"];
    themes.forEach(t => root.classList.remove(`theme-${t}`));
    root.classList.add(`theme-${styleName.replace(/_/g, '-')}`);
}

function calculateAnimationBounds(root, node, direction, mode) {
    const track = root.querySelector(".sign-track");
    const panel = root.querySelector(".sign-panel");
    const trackWidth = track.clientWidth;
    const textWidth = node.scrollWidth;
    const overflow = Math.max(textWidth - trackWidth, 0);

    if (mode === "marquee") {
        const from = direction === "right" ? `${-textWidth - 100}px` : `${trackWidth + 100}px`;
        const to   = direction === "right" ? `${trackWidth + 100}px` : `${-textWidth - 100}px`;
        node.style.setProperty("--move-from", from);
        node.style.setProperty("--move-to", to);
    }
    if (mode === "bounce") {
        const from = direction === "right" ? `${-overflow}px` : "0px";
        const to   = direction === "right" ? "0px" : `${-overflow}px`;
        node.style.setProperty("--bounce-from", from);
        node.style.setProperty("--bounce-to", to);
    }

    panel.style.minHeight = `${window.innerHeight}px`;
}

// -------------------------------------------------------
// LED BORDER DOTS
// -------------------------------------------------------
function renderLedBorderDots(root, config) {
    const container = root.querySelector('.led-border-container');
    if (!container) return;
    container.innerHTML = '';
    if (!config.led_border_dots) return;

    setTimeout(() => {
        const panel = root.querySelector('.sign-panel');
        if (!panel) return;
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        if (w < 20 || h < 20) return;

        const dotSize = 10;
        const gap = 22;
        const frag = document.createDocumentFragment();

        function makeDot(x, y, color, delay) {
            const d = document.createElement('div');
            d.className = 'led-dot';
            d.style.cssText = [
                `left:${x - dotSize/2}px`,
                `top:${y - dotSize/2}px`,
                `width:${dotSize}px`,
                `height:${dotSize}px`,
                `background:${color}`,
                `box-shadow:0 0 7px 2px ${color}`,
                `animation-delay:${delay}s`,
            ].join(';');
            frag.appendChild(d);
        }

        const cols = Math.floor(w / gap);
        const rows = Math.floor(h / gap);
        for (let i = 0; i < cols; i++) {
            makeDot((gap/2) + i*gap, gap/2, LED_PALETTE[i % LED_PALETTE.length], (i*0.07) % 1.8);
            makeDot((gap/2) + i*gap, h - gap/2, LED_PALETTE[(i+4) % LED_PALETTE.length], (i*0.07+0.9) % 1.8);
        }
        for (let i = 1; i < rows - 1; i++) {
            makeDot(gap/2, (gap/2) + i*gap, LED_PALETTE[(i+2) % LED_PALETTE.length], (i*0.09) % 1.8);
            makeDot(w - gap/2, (gap/2) + i*gap, LED_PALETTE[(i+6) % LED_PALETTE.length], (i*0.09+0.9) % 1.8);
        }
        container.appendChild(frag);
    }, 100);
}

// -------------------------------------------------------
// APPLY LED DOT STYLE
// -------------------------------------------------------
function applyLiteralLedStyle(node, config, fontSize, glow, brightness) {
    const dotSize = Math.max(8, Math.round(fontSize / 10));
    const color = config.text_color;
    const glowC  = hexToRgba(color, Math.min(0.95, 0.25 + glow / 85));
    const accentC = hexToRgba(config.accent_color, Math.min(0.9, 0.2 + glow / 100));

    node.style.color = 'transparent';
    node.style.webkitTextFillColor = 'transparent';
    node.style.backgroundImage = [
        `radial-gradient(circle,`,
        `  ${hexToRgba(color, 1)} 0 28%,`,
        `  ${hexToRgba(color, 0.88)} 29% 44%,`,
        `  ${hexToRgba(color, 0.18)} 45% 54%,`,
        `  transparent 55%)`
    ].join('');
    node.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    node.style.backgroundRepeat = 'repeat';
    node.style.backgroundPosition = 'center center';
    node.style.webkitBackgroundClip = 'text';
    node.style.backgroundClip = 'text';
    node.style.filter = `brightness(${brightness}%) contrast(120%) saturate(140%)`;
    node.style.textShadow = [
        `0 0 4px ${glowC}`,
        `0 0 14px ${glowC}`,
        `0 0 30px ${glowC}`,
        `0 0 60px ${accentC}`
    ].join(', ');
}

function applyPixelStyle(node, config, fontSize, glow, brightness) {
    const dotSize = Math.max(6, Math.round(fontSize / 12));
    const color = config.text_color;
    const glowC  = hexToRgba(color, Math.min(0.95, 0.3 + glow / 80));

    node.style.color = 'transparent';
    node.style.webkitTextFillColor = 'transparent';
    node.style.backgroundImage = [
        `radial-gradient(circle,`,
        `  ${hexToRgba(color, 1)} 0 35%,`,
        `  ${hexToRgba(color, 0.4)} 36% 48%,`,
        `  transparent 49%)`
    ].join('');
    node.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    node.style.backgroundRepeat = 'repeat';
    node.style.backgroundPosition = 'center center';
    node.style.webkitBackgroundClip = 'text';
    node.style.backgroundClip = 'text';
    node.style.filter = `brightness(${brightness}%) contrast(130%)`;
    node.style.textShadow = `0 0 8px ${glowC}, 0 0 24px ${glowC}`;
}

function clearDotStyle(node) {
    node.style.backgroundImage = 'none';
    node.style.backgroundSize = 'initial';
    node.style.backgroundRepeat = 'initial';
    node.style.backgroundPosition = 'initial';
    node.style.webkitBackgroundClip = 'border-box';
    node.style.backgroundClip = 'border-box';
    node.style.webkitTextFillColor = '';
}

// -------------------------------------------------------
// MAIN RENDER
// -------------------------------------------------------
function renderSign(config) {
    const message    = `${config.message || ""}`.trim() || "LED SIGN";
    const style      = `${config.style || "literal_led"}`;
    const animMode   = `${config.animation_mode || "marquee"}`;
    const direction  = `${config.direction || "left"}`;
    const glow       = parseInt(config.glow || 0, 10);
    const brightness = parseInt(config.brightness || 100, 10);
    const fontSize   = parseInt(config.font_size || 120, 10);
    const letterSpacing = parseInt(config.letter_spacing || 0, 10);
    const paddingX   = parseInt(config.padding_x || 0, 10);
    const paddingY   = parseInt(config.padding_y || 0, 10);
    const borderRadius = parseInt(config.border_radius || 0, 10);
    const borderWidth = parseInt(config.border_width || 0, 10);
    const speed      = parseInt(config.speed || 18, 10);
    const opacity    = parseInt(config.container_opacity || 100, 10) / 100;
    const textEffect = `${config.text_effect || "none"}`;

    stage.style.background = config.background_color;
    applyThemeClasses(stage, style);

    const panel = stage.querySelector(".sign-panel");
    panel.classList.toggle("has-grid", Boolean(config.show_background_grid));
    panel.style.paddingLeft   = `${paddingX}px`;
    panel.style.paddingRight  = `${paddingX}px`;
    panel.style.paddingTop    = `${paddingY}px`;
    panel.style.paddingBottom = `${paddingY}px`;
    panel.style.borderRadius  = `${borderRadius}px`;
    panel.style.border = borderWidth > 0
        ? `${borderWidth}px solid ${hexToRgba(config.accent_color, 0.7)}`
        : 'none';
    panel.style.opacity = opacity.toString();

    const normalizedMsg = config.uppercase ? message.toUpperCase() : message;

    if (matrixEngine && config.render_mode === 'matrix_scene') {
        renderLedBorderDots(stage, config);
        matrixEngine.render({ ...config, message: normalizedMsg });
        textNode.classList.remove("is-paused");
        matrixEngine.setPaused(paused);
        return;
    }
    if (matrixEngine) {
        matrixEngine.stop();
    }

    // Reset
    textNode.classList.remove('effect-rainbow','effect-fire','effect-ice','effect-matrix');
    clearDotStyle(textNode);
    textNode.style.color = config.text_color;
    textNode.style.webkitTextFillColor = '';
    textNode.style.filter = `brightness(${brightness}%)`;
    textNode.style.fontFamily = getFontFamily(config.font_family);
    textNode.style.fontSize = `clamp(40px, ${fontSize / 10}vw, ${fontSize}px)`;
    textNode.style.letterSpacing = `${letterSpacing}px`;

    // Text content
    if (config.multi_color && normalizedMsg.includes('|')) {
        textNode.innerHTML = buildColoredHTML(normalizedMsg, config, glow);
    } else {
        textNode.textContent = normalizedMsg;
    }

    if (textEffect !== 'none' && !config.multi_color) {
        textNode.classList.add(`effect-${textEffect}`);
    }

    const glowColor  = hexToRgba(config.text_color, Math.min(0.92, 0.2 + glow / 110));
    const accentGlow = hexToRgba(config.accent_color, Math.min(0.85, 0.18 + glow / 130));

    if (style === 'literal_led') {
        applyLiteralLedStyle(textNode, config, fontSize, glow, brightness);
    } else if (style === 'pixel') {
        applyPixelStyle(textNode, config, fontSize, glow, brightness);
    } else {
        let textShadow = 'none';
        if (config.shadow_enabled) {
            if (style === 'neon') {
                textShadow = [
                    `0 0 6px ${glowColor}`,
                    `0 0 16px ${glowColor}`,
                    `0 0 32px ${glowColor}`,
                    `0 0 64px ${accentGlow}`,
                    `0 0 100px ${accentGlow}`,
                ].join(', ');
            } else if (style === 'led') {
                textShadow = `0 0 8px ${glowColor}, 0 0 22px ${accentGlow}`;
            } else if (style === 'lcd') {
                textShadow = `0 0 4px ${glowColor}, 0 0 12px ${glowColor}`;
            } else if (style === 'billboard') {
                textShadow = `0 4px 14px rgba(0,0,0,0.6), 0 0 24px ${accentGlow}`;
            } else if (style === 'plasma') {
                textShadow = `0 0 10px ${glowColor}, 0 0 30px ${accentGlow}, 0 0 60px ${hexToRgba(config.accent_color, 0.5)}`;
            } else if (style === 'retro') {
                textShadow = `0 0 6px ${glowColor}, 0 0 20px ${glowColor}, 0 0 50px ${accentGlow}, 0 0 80px ${accentGlow}, 2px 2px 0 rgba(0,0,0,0.5)`;
            } else {
                textShadow = `0 8px 24px rgba(0,0,0,0.4)`;
            }
        }
        if (!config.multi_color) textNode.style.textShadow = textShadow;
        textNode.style.filter = `brightness(${brightness}%)`;
    }

    textNode.style.webkitTextStroke = config.outline
        ? `1.5px ${hexToRgba(config.accent_color, 0.6)}`
        : '0 transparent';

    textNode.classList.remove('is-marquee','is-bounce','is-static','blink-only','is-paused');
    if (animMode === 'marquee') textNode.classList.add('is-marquee');
    else if (animMode === 'bounce') textNode.classList.add('is-bounce');
    else textNode.classList.add('is-static');

    if (config.blink && animMode === 'static') textNode.classList.add('blink-only');
    else textNode.classList.toggle('is-blink', Boolean(config.blink));

    textNode.style.setProperty("--anim-duration", `${speed}s`);

    renderLedBorderDots(stage, config);

    requestAnimationFrame(() => calculateAnimationBounds(stage, textNode, direction, animMode));
}

// -------------------------------------------------------
// CONTROLS
// -------------------------------------------------------
function togglePause(force = null) {
    paused = force !== null ? Boolean(force) : !paused;
    textNode.classList.toggle("is-paused", paused);
    if (matrixEngine) {
        matrixEngine.setPaused(paused);
    }
    btnPause.innerHTML = paused
        ? `<i class="bi bi-play-fill"></i> Reanudar`
        : `<i class="bi bi-pause-fill"></i> Pausar`;
}

function tryFullscreen() {
    if (window.screenfull && screenfull.isEnabled) {
        screenfull.toggle(document.documentElement);
        return;
    }
    document.documentElement.requestFullscreen?.();
}

function showToolbarTemporary() {
    toolbar.classList.add("is-visible");
    clearTimeout(window._toolbarTimer);
    window._toolbarTimer = setTimeout(() => toolbar.classList.remove("is-visible"), 2500);
}

btnFullscreen.addEventListener("click", tryFullscreen);
btnPause.addEventListener("click", () => togglePause());
btnReset.addEventListener("click", () => location.reload());

document.addEventListener("mousemove", showToolbarTemporary);
document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "f") { e.preventDefault(); tryFullscreen(); }
    if (e.key === " ") { e.preventDefault(); togglePause(); }
    if (e.key.toLowerCase() === "r") { e.preventDefault(); location.reload(); }
});

window.addEventListener("resize", () => renderSign(window.DISPLAY_CONFIG || {}));

renderSign(window.DISPLAY_CONFIG || {});
showToolbarTemporary();

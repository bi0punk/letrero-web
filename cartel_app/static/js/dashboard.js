/* =====================================================
   LED SIGN STUDIO v2.0 - dashboard.js
   ===================================================== */

const $ = (selector) => document.querySelector(selector);

// LED color palette (matches real LED panels)
const LED_PALETTE = [
  '#ff2222', // red
  '#ffff00', // yellow
  '#22ff55', // green
  '#2299ff', // blue
  '#ff22cc', // magenta
  '#22ffee', // cyan
  '#ff8800', // orange
  '#ffffff', // white
];

const formFields = {
    preset_name:        $("#preset_name"),
    message:            $("#message"),
    style:              $("#style"),
    animation_mode:     $("#animation_mode"),
    direction:          $("#direction"),
    font_family:        $("#font_family"),
    font_size:          $("#font_size"),
    speed:              $("#speed"),
    text_color:         $("#text_color"),
    background_color:   $("#background_color"),
    accent_color:       $("#accent_color"),
    glow:               $("#glow"),
    brightness:         $("#brightness"),
    letter_spacing:     $("#letter_spacing"),
    padding_x:          $("#padding_x"),
    padding_y:          $("#padding_y"),
    border_radius:      $("#border_radius"),
    border_width:       $("#border_width"),
    uppercase:          $("#uppercase"),
    blink:              $("#blink"),
    outline:            $("#outline"),
    shadow_enabled:     $("#shadow_enabled"),
    show_background_grid: $("#show_background_grid"),
    container_opacity:  $("#container_opacity"),
    multi_color:        $("#multi_color"),
    led_border_dots:    $("#led_border_dots"),
    text_effect:        $("#text_effect"),
};

const previewRoot = $("#sign-preview");
const previewText = $("#sign-text-preview");
const previewShell = $("#preview-shell");
const presetsList = $("#presets-list");
const paletteDots = $("#palette-dots");

const rangeIndicators = [
    "font_size","speed","glow","brightness","letter_spacing",
    "padding_x","padding_y","border_radius","border_width","container_opacity"
];

// -------------------------------------------------------
// PALETTE DOTS PREVIEW
// -------------------------------------------------------
function renderPaletteDots() {
    if (!paletteDots) return;
    paletteDots.innerHTML = LED_PALETTE.map(color =>
        `<div class="palette-dot" style="background:${color}; box-shadow: 0 0 6px ${color};" title="${color}"></div>`
    ).join('');
}

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
        case "bebas":   return 'var(--font-bebas)';
        case "rubik":   return 'var(--font-rubik)';
        case "mono":    return '"SFMono-Regular", Consolas, monospace';
        case "digital": return 'var(--font-digital)';
        case "pacifico":return 'var(--font-pacifico)';
        case "orbitron":
        default:        return 'var(--font-orbitron)';
    }
}

function encodeConfig(config) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
        .replace(/\+/g, "-").replace(/\//g, "_");
}

// -------------------------------------------------------
// MULTI-COLOR HTML BUILDER
// -------------------------------------------------------
function buildColoredHTML(message, config, glowEnabled, glowAmount, textColor) {
    if (!config.multi_color) {
        return escapeHtmlChars(message);
    }

    const parts = message.split('|').filter(p => p.length > 0);
    if (parts.length <= 1) {
        return escapeHtmlChars(message);
    }

    return parts.map((part, i) => {
        const color = LED_PALETTE[i % LED_PALETTE.length];
        let style = `color:${color};`;

        if (glowEnabled && glowAmount > 0) {
            const g = hexToRgba(color, Math.min(0.95, 0.3 + glowAmount / 90));
            style += ` text-shadow: 0 0 6px ${g}, 0 0 18px ${g}, 0 0 36px ${g};`;
        }

        return `<span class="phrase-chunk" style="${style}">${escapeHtmlChars(part.trim())}</span>`;
    }).join('<span style="color:rgba(255,255,255,0.15);margin:0 4px;">·</span>');
}

// -------------------------------------------------------
// LED BORDER DOTS
// -------------------------------------------------------
let _dotsTimeout = null;

function renderLedBorderDots(root, config) {
    const container = root.querySelector('.led-border-container');
    if (!container) return;

    // Clear old dots
    container.innerHTML = '';

    if (!config.led_border_dots) return;

    // Defer until layout is done
    clearTimeout(_dotsTimeout);
    _dotsTimeout = setTimeout(() => {
        const panel = root.querySelector('.sign-panel');
        if (!panel) return;
        const w = panel.offsetWidth;
        const h = panel.offsetHeight;
        if (w < 20 || h < 20) return;

        const dotSize = 8;
        const gap = 18;
        const fragment = document.createDocumentFragment();

        function makeDot(x, y, color, delay) {
            const d = document.createElement('div');
            d.className = 'led-dot';
            d.style.cssText = [
                `left:${x - dotSize / 2}px`,
                `top:${y - dotSize / 2}px`,
                `width:${dotSize}px`,
                `height:${dotSize}px`,
                `background:${color}`,
                `box-shadow:0 0 5px 1px ${color}`,
                `animation-delay:${delay}s`,
            ].join(';');
            fragment.appendChild(d);
        }

        const cols = Math.floor(w / gap);
        const rows = Math.floor(h / gap);

        for (let i = 0; i < cols; i++) {
            const x = (gap / 2) + i * gap;
            const delay = (i * 0.08) % 1.8;
            makeDot(x, gap / 2, LED_PALETTE[i % LED_PALETTE.length], delay);
            makeDot(x, h - gap / 2, LED_PALETTE[(i + 4) % LED_PALETTE.length], delay + 0.9);
        }
        for (let i = 1; i < rows - 1; i++) {
            const y = (gap / 2) + i * gap;
            const delay = (i * 0.1) % 1.8;
            makeDot(gap / 2, y, LED_PALETTE[(i + 2) % LED_PALETTE.length], delay);
            makeDot(w - gap / 2, y, LED_PALETTE[(i + 6) % LED_PALETTE.length], delay + 0.9);
        }

        container.appendChild(fragment);
    }, 80);
}

// -------------------------------------------------------
// THEME CLASSES
// -------------------------------------------------------
function applyThemeClasses(root, styleName) {
    const themes = ["neon","led","literal-led","lcd","billboard","minimal","pixel","plasma","retro"];
    themes.forEach(t => root.classList.remove(`theme-${t}`));
    // convert underscore to hyphen for CSS
    const cssName = styleName.replace(/_/g, '-');
    root.classList.add(`theme-${cssName}`);
}

// -------------------------------------------------------
// ANIMATION BOUNDS
// -------------------------------------------------------
function calculateAnimationBounds(root, textNode, direction, mode) {
    const track = root.querySelector(".sign-track");
    const panel = root.querySelector(".sign-panel");
    const trackWidth = track.clientWidth;
    const textWidth = textNode.scrollWidth;
    const overflow = Math.max(textWidth - trackWidth, 0);

    if (mode === "marquee") {
        const from = direction === "right" ? `${-textWidth - 80}px` : `${trackWidth + 80}px`;
        const to   = direction === "right" ? `${trackWidth + 80}px` : `${-textWidth - 80}px`;
        textNode.style.setProperty("--move-from", from);
        textNode.style.setProperty("--move-to", to);
    }

    if (mode === "bounce") {
        const from = direction === "right" ? `${-overflow}px` : "0px";
        const to   = direction === "right" ? "0px" : `${-overflow}px`;
        textNode.style.setProperty("--bounce-from", from);
        textNode.style.setProperty("--bounce-to", to);
    }

    panel.style.minHeight = `${Math.max(220, Math.min(window.innerHeight * 0.68, 400))}px`;
}

// -------------------------------------------------------
// LITERAL LED STYLE
// -------------------------------------------------------
function applyLiteralLedStyle(root, textNode, config, fontSize, glow, brightness) {
    const dotSize = Math.max(8, Math.round(fontSize / 10));
    const color = config.text_color;
    const glowC = hexToRgba(color, Math.min(0.95, 0.25 + glow / 85));
    const accentC = hexToRgba(config.accent_color, Math.min(0.9, 0.2 + glow / 100));

    textNode.style.color = 'transparent';
    textNode.style.webkitTextFillColor = 'transparent';
    textNode.style.backgroundImage = [
        `radial-gradient(circle,`,
        `  ${hexToRgba(color, 1)} 0 28%,`,
        `  ${hexToRgba(color, 0.88)} 29% 44%,`,
        `  ${hexToRgba(color, 0.18)} 45% 54%,`,
        `  transparent 55%)`
    ].join('');
    textNode.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    textNode.style.backgroundRepeat = 'repeat';
    textNode.style.backgroundPosition = 'center center';
    textNode.style.webkitBackgroundClip = 'text';
    textNode.style.backgroundClip = 'text';
    textNode.style.filter = `brightness(${brightness}%) contrast(120%) saturate(140%)`;
    textNode.style.textShadow = [
        `0 0 4px ${glowC}`,
        `0 0 12px ${glowC}`,
        `0 0 28px ${glowC}`,
        `0 0 50px ${accentC}`
    ].join(', ');
}

function applyPixelStyle(root, textNode, config, fontSize, glow, brightness) {
    const dotSize = Math.max(6, Math.round(fontSize / 12));
    const color = config.text_color;
    const glowC = hexToRgba(color, Math.min(0.95, 0.3 + glow / 80));

    textNode.style.color = 'transparent';
    textNode.style.webkitTextFillColor = 'transparent';
    textNode.style.backgroundImage = [
        `radial-gradient(circle,`,
        `  ${hexToRgba(color, 1)} 0 35%,`,
        `  ${hexToRgba(color, 0.4)} 36% 48%,`,
        `  transparent 49%)`
    ].join('');
    textNode.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    textNode.style.backgroundRepeat = 'repeat';
    textNode.style.backgroundPosition = 'center center';
    textNode.style.webkitBackgroundClip = 'text';
    textNode.style.backgroundClip = 'text';
    textNode.style.filter = `brightness(${brightness}%) contrast(130%) saturate(120%)`;
    textNode.style.textShadow = `0 0 6px ${glowC}, 0 0 20px ${glowC}`;
}

function clearDotStyle(textNode) {
    textNode.style.backgroundImage = 'none';
    textNode.style.backgroundSize = 'initial';
    textNode.style.backgroundRepeat = 'initial';
    textNode.style.backgroundPosition = 'initial';
    textNode.style.webkitBackgroundClip = 'border-box';
    textNode.style.backgroundClip = 'border-box';
    textNode.style.webkitTextFillColor = '';
}

// -------------------------------------------------------
// MAIN RENDER FUNCTION
// -------------------------------------------------------
function renderSign(root, textNode, config) {
    const message = `${config.message || ""}`.trim() || "LED SIGN";
    const style = `${config.style || "literal_led"}`;
    const animMode = `${config.animation_mode || "marquee"}`;
    const direction = `${config.direction || "left"}`;
    const glow = parseInt(config.glow || 0, 10);
    const brightness = parseInt(config.brightness || 100, 10);
    const fontSize = parseInt(config.font_size || 120, 10);
    const letterSpacing = parseInt(config.letter_spacing || 0, 10);
    const paddingX = parseInt(config.padding_x || 0, 10);
    const paddingY = parseInt(config.padding_y || 0, 10);
    const borderRadius = parseInt(config.border_radius || 0, 10);
    const borderWidth = parseInt(config.border_width || 0, 10);
    const speed = parseInt(config.speed || 18, 10);
    const opacity = parseInt(config.container_opacity || 100, 10) / 100;
    const textEffect = `${config.text_effect || "none"}`;

    // Stage / panel
    root.style.background = config.background_color;
    applyThemeClasses(root, style);

    const panel = root.querySelector(".sign-panel");
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

    // Normalize message
    const normalizedMsg = config.uppercase ? message.toUpperCase() : message;

    // Text effects reset
    textNode.classList.remove('effect-rainbow', 'effect-fire', 'effect-ice', 'effect-matrix');
    clearDotStyle(textNode);
    textNode.style.color = config.text_color;
    textNode.style.webkitTextFillColor = '';
    textNode.style.filter = `brightness(${brightness}%)`;
    textNode.style.fontFamily = getFontFamily(config.font_family);
    textNode.style.fontSize = `clamp(32px, ${fontSize / 11}vw, ${fontSize}px)`;
    textNode.style.letterSpacing = `${letterSpacing}px`;

    // Build text content
    if (config.multi_color && normalizedMsg.includes('|')) {
        textNode.innerHTML = buildColoredHTML(normalizedMsg, config, config.shadow_enabled, glow, config.text_color);
    } else {
        textNode.textContent = normalizedMsg;
    }

    // Apply text effect (overrides color)
    if (textEffect !== 'none' && !config.multi_color) {
        textNode.classList.add(`effect-${textEffect}`);
    }

    // Per-style rendering
    const glowColor  = hexToRgba(config.text_color, Math.min(0.92, 0.2 + glow / 110));
    const accentGlow = hexToRgba(config.accent_color, Math.min(0.85, 0.18 + glow / 130));

    if (style === 'literal_led') {
        applyLiteralLedStyle(root, textNode, config, fontSize, glow, brightness);
    } else if (style === 'pixel') {
        applyPixelStyle(root, textNode, config, fontSize, glow, brightness);
    } else {
        // Text shadow per theme
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
                textShadow = [
                    `0 0 10px ${glowColor}`,
                    `0 0 30px ${accentGlow}`,
                    `0 0 60px ${hexToRgba(config.accent_color, 0.5)}`,
                ].join(', ');
            } else if (style === 'retro') {
                textShadow = [
                    `0 0 6px ${glowColor}`,
                    `0 0 20px ${glowColor}`,
                    `0 0 50px ${accentGlow}`,
                    `0 0 80px ${accentGlow}`,
                    `2px 2px 0 rgba(0,0,0,0.5)`,
                ].join(', ');
            } else {
                textShadow = `0 8px 24px rgba(0,0,0,0.4)`;
            }
        }
        if (!config.multi_color) {
            textNode.style.textShadow = textShadow;
        }
        textNode.style.filter = `brightness(${brightness}%)`;
    }

    // Outline
    textNode.style.webkitTextStroke = config.outline
        ? `1.5px ${hexToRgba(config.accent_color, 0.6)}`
        : '0 transparent';

    // Animation mode classes
    textNode.classList.remove('is-marquee', 'is-bounce', 'is-static', 'blink-only', 'is-paused');
    if (animMode === 'marquee') textNode.classList.add('is-marquee');
    else if (animMode === 'bounce') textNode.classList.add('is-bounce');
    else textNode.classList.add('is-static');

    if (config.blink && animMode === 'static') textNode.classList.add('blink-only');
    else textNode.classList.toggle('is-blink', Boolean(config.blink));

    textNode.style.setProperty("--anim-duration", `${speed}s`);

    // LED border dots
    renderLedBorderDots(root, config);

    requestAnimationFrame(() => calculateAnimationBounds(root, textNode, direction, animMode));
}

// -------------------------------------------------------
// FORM
// -------------------------------------------------------
function setInitialValues(config) {
    Object.entries(formFields).forEach(([key, el]) => {
        if (!el || !(key in config)) return;
        if (el.type === 'checkbox') el.checked = Boolean(config[key]);
        else el.value = config[key];
    });
    refreshRanges();
}

function refreshRanges() {
    rangeIndicators.forEach((key) => {
        const valueNode = document.getElementById(`${key}_value`);
        const field = formFields[key];
        if (!valueNode || !field) return;
        let suffix = '';
        if (["font_size","letter_spacing","padding_x","padding_y","border_radius","border_width"].includes(key)) suffix = ' px';
        else if (key === 'speed') suffix = ' s';
        else if (["glow","brightness","container_opacity"].includes(key)) suffix = '%';
        valueNode.textContent = `${field.value}${suffix}`;
    });
}

function getConfigFromForm() {
    const config = {};
    Object.entries(formFields).forEach(([key, el]) => {
        if (!el) return;
        config[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return config;
}

function updatePreview() {
    const config = getConfigFromForm();
    refreshRanges();
    renderSign(previewRoot, previewText, config);
}

function insertAtCursor(input, value) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    input.value = `${input.value.slice(0, start)}${value}${input.value.slice(end)}`;
    input.focus();
    input.selectionStart = input.selectionEnd = start + value.length;
    input.dispatchEvent(new Event("input"));
}

// -------------------------------------------------------
// PRESETS
// -------------------------------------------------------
async function savePreset() {
    const config = getConfigFromForm();
    const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: config.preset_name, config }),
    });
    if (!response.ok) { alert("No se pudo guardar el preset."); return; }
    await loadPresets();
}

async function loadPresets() {
    const response = await fetch("/api/presets");
    const presets = await response.json();
    if (!Array.isArray(presets) || presets.length === 0) {
        presetsList.innerHTML = `<div class="empty-state">Aún no hay presets. Crea uno desde el panel.</div>`;
        return;
    }
    presetsList.innerHTML = presets.map((p) => `
        <div class="preset-card" data-id="${p.id}">
            <div class="preset-card-top">
                <div>
                    <div class="preset-name">${escapeHtmlChars(p.name)}</div>
                    <div class="preset-meta">#${p.id} · ${escapeHtmlChars(String(p.payload.style).toUpperCase())} · ${escapeHtmlChars(p.payload.animation_mode)}</div>
                </div>
                <div class="preset-actions">
                    <button class="btn btn-sm btn-outline-warning btn-apply-preset" data-id="${p.id}">Aplicar</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-preset" data-id="${p.id}">Borrar</button>
                </div>
            </div>
            <div class="preset-snippet">${escapeHtmlChars(p.payload.message || "")}</div>
        </div>
    `).join('');
}

async function applyPreset(id) {
    const response = await fetch(`/api/presets/${id}`);
    if (!response.ok) { alert("No se pudo cargar el preset."); return; }
    const preset = await response.json();
    setInitialValues(preset.payload);
    updatePreview();
}

async function deletePreset(id) {
    if (!window.confirm("¿Borrar este preset?")) return;
    const response = await fetch(`/api/presets/${id}`, { method: "DELETE" });
    if (!response.ok) { alert("No se pudo borrar."); return; }
    await loadPresets();
}

// -------------------------------------------------------
// DISPLAY LINK
// -------------------------------------------------------
function openDisplay() {
    const config = getConfigFromForm();
    const token = encodeConfig(config);
    window.open(`${window.location.origin}/display?cfg=${token}`, "_blank", "noopener,noreferrer");
}

async function copyDisplayLink() {
    const config = getConfigFromForm();
    const token = encodeConfig(config);
    const url = `${window.location.origin}/display?cfg=${token}`;
    try {
        await navigator.clipboard.writeText(url);
        flashButton($("#btn-copy-display-link"), "Link copiado ✓");
    } catch {
        prompt("Copia manualmente:", url);
    }
}

function exportJson() {
    const config = getConfigFromForm();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cartel_${(config.preset_name || "preset").replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function flashButton(btn, text) {
    const orig = btn.innerHTML;
    btn.innerHTML = `<i class="bi bi-check2"></i> ${text}`;
    setTimeout(() => { btn.innerHTML = orig; }, 1600);
}

function tryFullscreenPreview() {
    if (window.screenfull && screenfull.isEnabled) {
        screenfull.toggle(previewShell);
        return;
    }
    previewShell.requestFullscreen?.();
}

// -------------------------------------------------------
// BIND EVENTS
// -------------------------------------------------------
function bindEvents() {
    Object.values(formFields).forEach((field) => {
        if (!field) return;
        field.addEventListener("input", updatePreview);
        field.addEventListener("change", updatePreview);
    });

    document.querySelectorAll(".emoji-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const text = btn.dataset.insert ?? btn.textContent;
            insertAtCursor(formFields.message, text);
        });
    });

    $("#btn-save-preset").addEventListener("click", savePreset);
    $("#btn-open-display").addEventListener("click", openDisplay);
    $("#btn-copy-display-link").addEventListener("click", copyDisplayLink);
    $("#btn-export-json").addEventListener("click", exportJson);
    $("#btn-fullscreen-preview").addEventListener("click", tryFullscreenPreview);
    $("#btn-refresh-presets").addEventListener("click", loadPresets);
    $("#btn-load-defaults").addEventListener("click", () => {
        setInitialValues(window.APP_DEFAULT_CONFIG || {});
        updatePreview();
    });

    presetsList.addEventListener("click", (e) => {
        const applyBtn = e.target.closest(".btn-apply-preset");
        const deleteBtn = e.target.closest(".btn-delete-preset");
        if (applyBtn) applyPreset(applyBtn.dataset.id);
        if (deleteBtn) deletePreset(deleteBtn.dataset.id);
    });

    window.addEventListener("resize", updatePreview);
    document.addEventListener("keydown", (e) => {
        if (["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName)) return;
        if (e.key.toLowerCase() === "f") { e.preventDefault(); tryFullscreenPreview(); }
    });
}

// -------------------------------------------------------
// INIT
// -------------------------------------------------------
renderPaletteDots();
setInitialValues(window.APP_DEFAULT_CONFIG || {});
bindEvents();
updatePreview();
loadPresets();

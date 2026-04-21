const $ = (selector) => document.querySelector(selector);

const formFields = {
    preset_name: $("#preset_name"),
    message: $("#message"),
    style: $("#style"),
    animation_mode: $("#animation_mode"),
    direction: $("#direction"),
    font_family: $("#font_family"),
    font_size: $("#font_size"),
    speed: $("#speed"),
    text_color: $("#text_color"),
    background_color: $("#background_color"),
    accent_color: $("#accent_color"),
    glow: $("#glow"),
    brightness: $("#brightness"),
    letter_spacing: $("#letter_spacing"),
    padding_x: $("#padding_x"),
    padding_y: $("#padding_y"),
    border_radius: $("#border_radius"),
    border_width: $("#border_width"),
    uppercase: $("#uppercase"),
    blink: $("#blink"),
    outline: $("#outline"),
    shadow_enabled: $("#shadow_enabled"),
    show_background_grid: $("#show_background_grid"),
    container_opacity: $("#container_opacity"),
};

const previewRoot = $("#sign-preview");
const previewText = $("#sign-text-preview");
const previewShell = $("#preview-shell");
const presetsList = $("#presets-list");

const rangeIndicators = [
    "font_size", "speed", "glow", "brightness", "letter_spacing",
    "padding_x", "padding_y", "border_radius", "border_width", "container_opacity"
];

function setInitialValues(config) {
    Object.entries(formFields).forEach(([key, element]) => {
        if (!element || !(key in config)) return;
        if (element.type === "checkbox") {
            element.checked = Boolean(config[key]);
        } else {
            element.value = config[key];
        }
    });
    refreshRanges();
}

function refreshRanges() {
    rangeIndicators.forEach((key) => {
        const valueNode = document.getElementById(`${key}_value`);
        const field = formFields[key];
        if (!valueNode || !field) return;
        let suffix = "";
        if (["font_size", "letter_spacing", "padding_x", "padding_y", "border_radius", "border_width"].includes(key)) {
            suffix = " px";
        } else if (key === "speed") {
            suffix = " s";
        } else if (["glow", "brightness", "container_opacity"].includes(key)) {
            suffix = "%";
        }
        valueNode.textContent = `${field.value}${suffix}`;
    });
}

function getConfigFromForm() {
    const config = {};
    Object.entries(formFields).forEach(([key, element]) => {
        if (!element) return;
        config[key] = element.type === "checkbox" ? element.checked : element.value;
    });
    return config;
}

function hexToRgba(hex, alpha = 1) {
    const value = (hex || "#ffffff").replace("#", "");
    if (value.length !== 6) return `rgba(255,255,255,${alpha})`;
    const r = parseInt(value.substring(0, 2), 16);
    const g = parseInt(value.substring(2, 4), 16);
    const b = parseInt(value.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getFontFamily(fontFamily) {
    switch (fontFamily) {
        case "bebas":
            return 'var(--font-bebas)';
        case "rubik":
            return 'var(--font-rubik)';
        case "mono":
            return 'var(--font-mono)';
        case "pacifico":
            return 'var(--font-pacifico)';
        case "orbitron":
        default:
            return 'var(--font-orbitron)';
    }
}

function encodeConfig(config) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(config))))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
}

function applyThemeClasses(root, styleName) {
    root.classList.remove("theme-neon", "theme-led", "theme-literal-led", "theme-lcd", "theme-billboard", "theme-minimal");
    root.classList.add(`theme-${styleName}`);
}

function calculateAnimationBounds(root, textNode, direction, mode) {
    const track = root.querySelector(".sign-track");
    const panel = root.querySelector(".sign-panel");
    const trackWidth = track.clientWidth;
    const textWidth = textNode.scrollWidth;
    const overflow = Math.max(textWidth - trackWidth, 0);

    if (mode === "marquee") {
        const from = direction === "right" ? `${-textWidth - 60}px` : `${trackWidth + 60}px`;
        const to = direction === "right" ? `${trackWidth + 60}px` : `${-textWidth - 60}px`;
        textNode.style.setProperty("--move-from", from);
        textNode.style.setProperty("--move-to", to);
    }

    if (mode === "bounce") {
        const from = direction === "right" ? `${-overflow}px` : "0px";
        const to = direction === "right" ? "0px" : `${-overflow}px`;
        textNode.style.setProperty("--bounce-from", from);
        textNode.style.setProperty("--bounce-to", to);
    }

    panel.style.minHeight = `${Math.max(220, Math.min(window.innerHeight * 0.72, 420))}px`;
}

function applyLiteralLedStyle(root, textNode, config, fontSize, glow, brightness) {
    const panel = root.querySelector(".sign-panel");
    const ornament = root.querySelector(".led-ornament");
    const dotSize = Math.max(10, Math.round(fontSize / 8));
    const glowColor = hexToRgba(config.text_color, Math.min(0.98, 0.22 + glow / 95));
    const accentGlow = hexToRgba(config.accent_color, Math.min(0.95, 0.22 + glow / 105));

    if (ornament) {
        ornament.style.setProperty("--ornament-color", config.accent_color || "#2c5cff");
    }
    if (panel) {
        panel.style.setProperty("--ornament-color", config.accent_color || "#2c5cff");
    }

    textNode.classList.add("literal-led-text");
    textNode.style.color = "transparent";
    textNode.style.webkitTextFillColor = "transparent";
    textNode.style.backgroundImage = `radial-gradient(circle, ${hexToRgba(config.text_color, 1)} 0 26%, ${hexToRgba(config.text_color, 0.92)} 27% 46%, ${hexToRgba(config.text_color, 0.24)} 47% 56%, transparent 57%)`;
    textNode.style.backgroundSize = `${dotSize}px ${dotSize}px`;
    textNode.style.backgroundRepeat = "repeat";
    textNode.style.backgroundPosition = "center center";
    textNode.style.webkitBackgroundClip = "text";
    textNode.style.backgroundClip = "text";
    textNode.style.filter = `brightness(${brightness}%) contrast(118%)`;
    textNode.style.textShadow = `0 0 4px ${glowColor}, 0 0 14px ${glowColor}, 0 0 28px ${accentGlow}`;
}

function clearLiteralLedStyle(root, textNode) {
    const panel = root.querySelector(".sign-panel");
    const ornament = root.querySelector(".led-ornament");
    textNode.classList.remove("literal-led-text");
    textNode.style.backgroundImage = "none";
    textNode.style.backgroundSize = "initial";
    textNode.style.backgroundRepeat = "initial";
    textNode.style.backgroundPosition = "initial";
    textNode.style.webkitBackgroundClip = "border-box";
    textNode.style.backgroundClip = "border-box";
    textNode.style.webkitTextFillColor = "";
    if (ornament) {
        ornament.style.removeProperty("--ornament-color");
    }
    if (panel) {
        panel.style.removeProperty("--ornament-color");
    }
}

function renderSign(root, textNode, config) {
    const message = `${config.message || ""}`.trim() || "Cartel sin texto";
    const style = `${config.style || "neon"}`;
    const animationMode = `${config.animation_mode || "marquee"}`;
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
    const containerOpacity = parseInt(config.container_opacity || 100, 10) / 100;

    root.style.background = config.background_color;
    applyThemeClasses(root, style);

    const panel = root.querySelector(".sign-panel");
    panel.classList.toggle("has-grid", Boolean(config.show_background_grid));
    panel.style.paddingLeft = `${paddingX}px`;
    panel.style.paddingRight = `${paddingX}px`;
    panel.style.paddingTop = `${paddingY}px`;
    panel.style.paddingBottom = `${paddingY}px`;
    panel.style.borderRadius = `${borderRadius}px`;
    panel.style.border = borderWidth > 0 ? `${borderWidth}px solid ${hexToRgba(config.accent_color, 0.65)}` : "none";
    panel.style.opacity = containerOpacity.toString();

    const normalizedMessage = config.uppercase ? message.toUpperCase() : message;
    textNode.textContent = normalizedMessage;
    textNode.style.fontFamily = getFontFamily(config.font_family);
    textNode.style.fontSize = `clamp(32px, ${fontSize / 12}vw, ${fontSize}px)`;
    textNode.style.letterSpacing = `${letterSpacing}px`;
    clearLiteralLedStyle(root, textNode);
    textNode.style.color = config.text_color;
    textNode.style.filter = `brightness(${brightness}%)`;

    const glowColor = hexToRgba(config.text_color, Math.min(0.95, 0.18 + glow / 110));
    const accentGlow = hexToRgba(config.accent_color, Math.min(0.85, 0.16 + glow / 130));

    let textShadow = "none";
    if (config.shadow_enabled) {
        if (style === "neon") {
            textShadow = `0 0 8px ${glowColor}, 0 0 18px ${glowColor}, 0 0 36px ${accentGlow}, 0 0 64px ${accentGlow}`;
        } else if (style === "led") {
            textShadow = `0 0 8px ${glowColor}, 0 0 18px ${accentGlow}`;
        } else if (style === "literal_led") {
            textShadow = `0 0 4px ${glowColor}, 0 0 14px ${glowColor}, 0 0 28px ${accentGlow}`;
        } else if (style === "lcd") {
            textShadow = `0 0 6px ${glowColor}, 0 0 16px ${glowColor}`;
        } else if (style === "billboard") {
            textShadow = `0 6px 16px rgba(0,0,0,0.55), 0 0 20px ${accentGlow}`;
        } else {
            textShadow = `0 10px 28px rgba(0,0,0,0.45)`;
        }
    }
    textNode.style.textShadow = textShadow;
    textNode.style.webkitTextStroke = config.outline ? `1px ${hexToRgba(config.accent_color, 0.45)}` : "0 transparent";

    if (style === "literal_led") {
        applyLiteralLedStyle(root, textNode, config, fontSize, glow, brightness);
    }

    textNode.classList.remove("is-marquee", "is-bounce", "is-static", "blink-only", "is-paused");
    if (animationMode === "marquee") {
        textNode.classList.add("is-marquee");
    } else if (animationMode === "bounce") {
        textNode.classList.add("is-bounce");
    } else {
        textNode.classList.add("is-static");
    }

    if (config.blink && animationMode === "static") {
        textNode.classList.add("blink-only");
    } else {
        textNode.classList.toggle("is-blink", Boolean(config.blink));
    }

    textNode.style.setProperty("--anim-duration", `${speed}s`);

    requestAnimationFrame(() => calculateAnimationBounds(root, textNode, direction, animationMode));
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

async function savePreset() {
    const config = getConfigFromForm();
    const payload = {
        name: config.preset_name,
        config,
    };

    const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        alert("No se pudo guardar el preset.");
        return;
    }

    formFields.preset_name.value = config.preset_name || "Preset";
    await loadPresets();
}

async function loadPresets() {
    const response = await fetch("/api/presets");
    const presets = await response.json();

    if (!Array.isArray(presets) || presets.length === 0) {
        presetsList.innerHTML = `<div class="empty-state">Aún no hay presets guardados. Crea uno desde el panel izquierdo.</div>`;
        return;
    }

    presetsList.innerHTML = presets.map((preset) => `
        <div class="preset-card" data-id="${preset.id}">
            <div class="preset-card-top">
                <div>
                    <div class="preset-name">${escapeHtml(preset.name)}</div>
                    <div class="preset-meta">#${preset.id} · ${escapeHtml(String(preset.payload.style).toUpperCase())} · ${escapeHtml(preset.payload.animation_mode)}</div>
                </div>
                <div class="preset-actions">
                    <button class="btn btn-sm btn-outline-warning btn-apply-preset" data-id="${preset.id}">Aplicar</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-preset" data-id="${preset.id}">Borrar</button>
                </div>
            </div>
            <div class="preset-snippet">${escapeHtml(preset.payload.message || "")}</div>
        </div>
    `).join("");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

async function applyPreset(id) {
    const response = await fetch(`/api/presets/${id}`);
    if (!response.ok) {
        alert("No se pudo cargar el preset.");
        return;
    }
    const preset = await response.json();
    setInitialValues(preset.payload);
    updatePreview();
}

async function deletePreset(id) {
    const ok = window.confirm("¿Borrar este preset?");
    if (!ok) return;

    const response = await fetch(`/api/presets/${id}`, { method: "DELETE" });
    if (!response.ok) {
        alert("No se pudo borrar.");
        return;
    }
    await loadPresets();
}

function openDisplay() {
    const config = getConfigFromForm();
    const token = encodeConfig(config);
    const url = `${window.location.origin}/display?cfg=${token}`;
    window.open(url, "_blank", "noopener,noreferrer");
}

async function copyDisplayLink() {
    const config = getConfigFromForm();
    const token = encodeConfig(config);
    const url = `${window.location.origin}/display?cfg=${token}`;
    try {
        await navigator.clipboard.writeText(url);
        flashButton($("#btn-copy-display-link"), "Link copiado");
    } catch {
        prompt("Copia manualmente este enlace:", url);
    }
}

function exportJson() {
    const config = getConfigFromForm();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cartel_${(config.preset_name || "preset").replace(/\s+/g, "_").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function flashButton(button, text) {
    const original = button.innerHTML;
    button.innerHTML = `<i class="bi bi-check2"></i> ${text}`;
    setTimeout(() => {
        button.innerHTML = original;
    }, 1400);
}

function tryFullscreenPreview() {
    if (window.screenfull && screenfull.isEnabled) {
        screenfull.toggle(previewShell);
        return;
    }
    if (previewShell.requestFullscreen) {
        previewShell.requestFullscreen();
        return;
    }
    alert("Tu navegador no soporta fullscreen programático para este contenedor.");
}

function handleKeyboardShortcuts(event) {
    if (event.target && ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
        return;
    }
    if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        tryFullscreenPreview();
    }
}

function bindEvents() {
    Object.values(formFields).forEach((field) => {
        if (!field) return;
        field.addEventListener("input", updatePreview);
        field.addEventListener("change", updatePreview);
    });

    document.querySelectorAll(".emoji-btn").forEach((btn) => {
        btn.addEventListener("click", () => insertAtCursor(formFields.message, btn.textContent));
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

    presetsList.addEventListener("click", (event) => {
        const applyBtn = event.target.closest(".btn-apply-preset");
        const deleteBtn = event.target.closest(".btn-delete-preset");
        if (applyBtn) {
            applyPreset(applyBtn.dataset.id);
        }
        if (deleteBtn) {
            deletePreset(deleteBtn.dataset.id);
        }
    });

    window.addEventListener("resize", updatePreview);
    document.addEventListener("keydown", handleKeyboardShortcuts);
}

setInitialValues(window.APP_DEFAULT_CONFIG || {});
bindEvents();
updatePreview();
loadPresets();

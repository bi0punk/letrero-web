const stage = document.getElementById("display-stage");
const textNode = document.getElementById("sign-text-display");
const toolbar = document.getElementById("display-toolbar");
const btnFullscreen = document.getElementById("btn-display-fullscreen");
const btnPause = document.getElementById("btn-toggle-pause");
const btnReset = document.getElementById("btn-reset-motion");

let paused = false;

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

function applyThemeClasses(root, styleName) {
    root.classList.remove("theme-neon", "theme-led", "theme-lcd", "theme-billboard", "theme-minimal");
    root.classList.add(`theme-${styleName}`);
}

function calculateAnimationBounds(root, textNode, direction, mode) {
    const track = root.querySelector(".sign-track");
    const panel = root.querySelector(".sign-panel");
    const trackWidth = track.clientWidth;
    const textWidth = textNode.scrollWidth;
    const overflow = Math.max(textWidth - trackWidth, 0);

    if (mode === "marquee") {
        const from = direction === "right" ? `${-textWidth - 80}px` : `${trackWidth + 80}px`;
        const to = direction === "right" ? `${trackWidth + 80}px` : `${-textWidth - 80}px`;
        textNode.style.setProperty("--move-from", from);
        textNode.style.setProperty("--move-to", to);
    }

    if (mode === "bounce") {
        const from = direction === "right" ? `${-overflow}px` : "0px";
        const to = direction === "right" ? "0px" : `${-overflow}px`;
        textNode.style.setProperty("--bounce-from", from);
        textNode.style.setProperty("--bounce-to", to);
    }

    panel.style.minHeight = `${window.innerHeight}px`;
}

function renderSign(config) {
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

    stage.style.background = config.background_color;
    applyThemeClasses(stage, style);

    const panel = stage.querySelector(".sign-panel");
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
    textNode.style.fontSize = `clamp(40px, ${fontSize / 10}vw, ${fontSize}px)`;
    textNode.style.letterSpacing = `${letterSpacing}px`;
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

    requestAnimationFrame(() => calculateAnimationBounds(stage, textNode, direction, animationMode));
}

function togglePause(forceState = null) {
    paused = forceState !== null ? Boolean(forceState) : !paused;
    textNode.classList.toggle("is-paused", paused);
    btnPause.innerHTML = paused
        ? `<i class="bi bi-play-fill"></i> Reanudar`
        : `<i class="bi bi-pause-fill"></i> Pausar`;
}

function tryFullscreen() {
    if (window.screenfull && screenfull.isEnabled) {
        screenfull.toggle(document.documentElement);
        return;
    }
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
        return;
    }
}

function restartAnimation() {
    const current = textNode.cloneNode(true);
    textNode.replaceWith(current);
    window.textNode = current;
    location.reload();
}

function showToolbarTemporary() {
    toolbar.classList.add("is-visible");
    clearTimeout(window._toolbarTimer);
    window._toolbarTimer = setTimeout(() => {
        toolbar.classList.remove("is-visible");
    }, 2200);
}

btnFullscreen.addEventListener("click", tryFullscreen);
btnPause.addEventListener("click", () => togglePause());
btnReset.addEventListener("click", restartAnimation);

document.addEventListener("mousemove", showToolbarTemporary);
document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        tryFullscreen();
    }
    if (event.key === " ") {
        event.preventDefault();
        togglePause();
    }
    if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        restartAnimation();
    }
});

window.addEventListener("resize", () => renderSign(window.DISPLAY_CONFIG || {}));

renderSign(window.DISPLAY_CONFIG || {});
showToolbarTemporary();

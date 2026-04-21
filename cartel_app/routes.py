import base64
import json
from typing import Any, Dict

from flask import Blueprint, jsonify, render_template, request

from .db import delete_preset, get_preset, list_presets, upsert_preset
from .defaults import DEFAULT_CONFIG

bp = Blueprint("main", __name__)

ALLOWED_STYLES = {"neon", "led", "literal_led", "lcd", "billboard", "minimal", "pixel", "plasma", "retro"}
ALLOWED_ANIMATIONS = {"marquee", "bounce", "static"}
ALLOWED_DIRECTIONS = {"left", "right"}
ALLOWED_FONTS = {"orbitron", "bebas", "rubik", "mono", "pacifico", "digital"}
ALLOWED_EFFECTS = {"none", "rainbow", "fire", "ice", "matrix"}


def clamp(value: Any, min_value: int, max_value: int, default: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(min(number, max_value), min_value)


def clamp_hex_color(value: Any, default: str) -> str:
    if isinstance(value, str) and len(value) == 7 and value.startswith("#"):
        hex_chars = value[1:]
        if all(ch.lower() in "0123456789abcdef" for ch in hex_chars):
            return value.lower()
    return default


def to_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    if isinstance(value, (int, float)):
        return bool(value)
    return default


def sanitize_config(payload: Dict[str, Any]) -> Dict[str, Any]:
    data = dict(DEFAULT_CONFIG)
    if not isinstance(payload, dict):
        return data

    message = str(payload.get("message", data["message"])).strip()
    if not message:
        message = data["message"]

    preset_name = str(payload.get("preset_name", data["preset_name"])).strip() or data["preset_name"]
    style = str(payload.get("style", data["style"])).lower()
    animation_mode = str(payload.get("animation_mode", data["animation_mode"])).lower()
    direction = str(payload.get("direction", data["direction"])).lower()
    font_family = str(payload.get("font_family", data["font_family"])).lower()
    text_effect = str(payload.get("text_effect", data["text_effect"])).lower()

    data.update(
        {
            "preset_name": preset_name[:80],
            "message": message[:500],
            "style": style if style in ALLOWED_STYLES else data["style"],
            "animation_mode": animation_mode if animation_mode in ALLOWED_ANIMATIONS else data["animation_mode"],
            "direction": direction if direction in ALLOWED_DIRECTIONS else data["direction"],
            "font_family": font_family if font_family in ALLOWED_FONTS else data["font_family"],
            "font_size": clamp(payload.get("font_size"), 32, 280, data["font_size"]),
            "speed": clamp(payload.get("speed"), 4, 60, data["speed"]),
            "glow": clamp(payload.get("glow"), 0, 100, data["glow"]),
            "brightness": clamp(payload.get("brightness"), 30, 180, data["brightness"]),
            "letter_spacing": clamp(payload.get("letter_spacing"), 0, 40, data["letter_spacing"]),
            "padding_x": clamp(payload.get("padding_x"), 0, 160, data["padding_x"]),
            "padding_y": clamp(payload.get("padding_y"), 0, 100, data["padding_y"]),
            "border_radius": clamp(payload.get("border_radius"), 0, 90, data["border_radius"]),
            "border_width": clamp(payload.get("border_width"), 0, 20, data["border_width"]),
            "text_color": clamp_hex_color(payload.get("text_color"), data["text_color"]),
            "background_color": clamp_hex_color(payload.get("background_color"), data["background_color"]),
            "accent_color": clamp_hex_color(payload.get("accent_color"), data["accent_color"]),
            "uppercase": to_bool(payload.get("uppercase"), data["uppercase"]),
            "blink": to_bool(payload.get("blink"), data["blink"]),
            "outline": to_bool(payload.get("outline"), data["outline"]),
            "shadow_enabled": to_bool(payload.get("shadow_enabled"), data["shadow_enabled"]),
            "show_background_grid": to_bool(payload.get("show_background_grid"), data["show_background_grid"]),
            "container_opacity": clamp(payload.get("container_opacity"), 10, 100, data["container_opacity"]),
            "multi_color": to_bool(payload.get("multi_color"), data["multi_color"]),
            "led_border_dots": to_bool(payload.get("led_border_dots"), data["led_border_dots"]),
            "text_effect": text_effect if text_effect in ALLOWED_EFFECTS else data["text_effect"],
        }
    )
    return data


@bp.get("/")
def index():
    presets = list_presets()
    initial_config = DEFAULT_CONFIG
    encoded = base64.urlsafe_b64encode(
        json.dumps(initial_config, ensure_ascii=False).encode("utf-8")
    ).decode("utf-8")
    return render_template(
        "dashboard.html",
        default_config=DEFAULT_CONFIG,
        initial_config=initial_config,
        presets=presets,
        display_token=encoded,
    )


@bp.get("/display")
def display():
    cfg = request.args.get("cfg", "")
    config = DEFAULT_CONFIG
    if cfg:
        try:
            raw = base64.urlsafe_b64decode(cfg.encode("utf-8"))
            config = sanitize_config(json.loads(raw.decode("utf-8")))
        except Exception:
            config = DEFAULT_CONFIG
    return render_template("display.html", config=config)


@bp.get("/api/default-config")
def api_default_config():
    return jsonify(sanitize_config(DEFAULT_CONFIG))


@bp.get("/api/presets")
def api_list_presets():
    return jsonify(list_presets())


@bp.get("/api/presets/<int:preset_id>")
def api_get_preset(preset_id: int):
    preset = get_preset(preset_id)
    if preset is None:
        return jsonify({"error": "Preset no encontrado"}), 404
    return jsonify(preset)


@bp.post("/api/presets")
def api_save_preset():
    payload = request.get_json(silent=True) or {}
    preset_id = payload.get("id")
    config = sanitize_config(payload.get("config", {}))
    name = str(payload.get("name", config["preset_name"])).strip() or config["preset_name"]

    saved = upsert_preset(name=name[:80], payload=config, preset_id=preset_id)
    return jsonify({"ok": True, "preset": saved})


@bp.delete("/api/presets/<int:preset_id>")
def api_delete_preset(preset_id: int):
    ok = delete_preset(preset_id)
    if not ok:
        return jsonify({"error": "Preset no encontrado"}), 404
    return jsonify({"ok": True})

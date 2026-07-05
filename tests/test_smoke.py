from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent


def test_repo_has_readme():
    assert (REPO_ROOT / "README.md").exists()


def test_repo_has_gitignore():
    assert (REPO_ROOT / ".gitignore").exists()


def test_repo_has_license():
    assert (REPO_ROOT / "LICENSE").exists()


def test_app_creates():
    from cartel_app import create_app
    app = create_app()
    assert app is not None
    assert app.testing is False


def test_routes_import():
    from cartel_app.routes import sanitize_config, clamp
    assert callable(sanitize_config)
    assert callable(clamp)


def test_default_config():
    from cartel_app.routes import sanitize_config
    cfg = sanitize_config({})
    assert cfg["style"] in {"neon", "led", "literal_led", "lcd", "billboard", "minimal", "pixel", "plasma", "retro"}
    assert cfg["render_mode"] in {"text", "matrix_scene"}

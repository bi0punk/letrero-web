from flask import Flask
from pathlib import Path

from .db import init_db
from .routes import bp


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config["SECRET_KEY"] = "cambiar-esto-en-produccion"
    app.config["DATABASE"] = str(Path(app.instance_path) / "carteles.db")

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    with app.app_context():
        init_db()

    app.register_blueprint(bp)
    return app

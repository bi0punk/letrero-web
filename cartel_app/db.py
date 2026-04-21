import json
import sqlite3
from typing import Any, Dict, List, Optional

from flask import current_app, g


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db() -> None:
    db = get_db()
    db.execute(
        '''
        CREATE TABLE IF NOT EXISTS presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        '''
    )
    db.commit()
    current_app.teardown_appcontext(close_db)


def list_presets() -> List[Dict[str, Any]]:
    rows = get_db().execute(
        "SELECT id, name, payload, created_at, updated_at FROM presets ORDER BY updated_at DESC, id DESC"
    ).fetchall()

    presets = []
    for row in rows:
        payload = json.loads(row["payload"])
        presets.append(
            {
                "id": row["id"],
                "name": row["name"],
                "payload": payload,
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }
        )
    return presets


def get_preset(preset_id: int) -> Optional[Dict[str, Any]]:
    row = get_db().execute(
        "SELECT id, name, payload, created_at, updated_at FROM presets WHERE id = ?",
        (preset_id,),
    ).fetchone()
    if row is None:
        return None

    return {
        "id": row["id"],
        "name": row["name"],
        "payload": json.loads(row["payload"]),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def upsert_preset(name: str, payload: Dict[str, Any], preset_id: Optional[int] = None) -> Dict[str, Any]:
    db = get_db()
    if preset_id:
        db.execute(
            '''
            UPDATE presets
            SET name = ?, payload = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            ''',
            (name, json.dumps(payload, ensure_ascii=False), preset_id),
        )
    else:
        db.execute(
            '''
            INSERT INTO presets (name, payload)
            VALUES (?, ?)
            ''',
            (name, json.dumps(payload, ensure_ascii=False)),
        )
    db.commit()

    if preset_id:
        return get_preset(preset_id)
    last_id = db.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    return get_preset(last_id)


def delete_preset(preset_id: int) -> bool:
    db = get_db()
    result = db.execute("DELETE FROM presets WHERE id = ?", (preset_id,))
    db.commit()
    return result.rowcount > 0

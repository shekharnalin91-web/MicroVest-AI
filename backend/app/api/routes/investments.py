
import sqlite3
from pathlib import Path
from datetime import date

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/investments", tags=["Investments"])

DB_PATH = Path(__file__).resolve().parents[2] / "db" / "microvest.db"


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_name TEXT NOT NULL,
                asset_type TEXT NOT NULL,
                amount_invested REAL NOT NULL,
                current_value REAL NOT NULL,
                created_at TEXT NOT NULL,
                user_id TEXT
            )
        """)

        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(investments)"
            ).fetchall()
        ]

        if "user_id" not in columns:
            connection.execute(
                "ALTER TABLE investments ADD COLUMN user_id TEXT"
            )

        # Preserve existing investments under the original account
        original_user = connection.execute("""
            SELECT id FROM users
            ORDER BY created_at ASC
            LIMIT 1
        """).fetchone()

        if original_user:
            connection.execute("""
                UPDATE investments
                SET user_id = ?
                WHERE user_id IS NULL
            """, (original_user["id"],))

        connection.commit()

    finally:
        connection.close()


create_table()


class InvestmentCreate(BaseModel):
    asset_name: str = Field(min_length=1)
    asset_type: str
    amount_invested: float = Field(gt=0)
    current_value: float = Field(ge=0)


@router.get("/")
def get_investments(
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT id, asset_name, asset_type,
                   amount_invested, current_value, created_at
            FROM investments
            WHERE user_id = ?
            ORDER BY id DESC
        """, (current_user["id"],)).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


@router.post("/")
def add_investment(
    investment: InvestmentCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        cursor = connection.execute("""
            INSERT INTO investments
            (asset_name, asset_type, amount_invested,
             current_value, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            investment.asset_name,
            investment.asset_type,
            investment.amount_invested,
            investment.current_value,
            str(date.today()),
            current_user["id"]
        ))

        connection.commit()
        investment_id = cursor.lastrowid

        return {
            "message": "Investment added successfully",
            "id": investment_id
        }

    finally:
        connection.close()


@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        cursor = connection.execute("""
            DELETE FROM investments
            WHERE id = ? AND user_id = ?
        """, (investment_id, current_user["id"]))

        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Investment not found"
            )

        return {"message": "Investment deleted successfully"}

    finally:
        connection.close()

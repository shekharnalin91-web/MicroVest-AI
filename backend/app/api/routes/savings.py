
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import date
from pathlib import Path
from uuid import uuid4
import sqlite3

from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/savings", tags=["Savings Goals"])

DB_PATH = Path(__file__).resolve().parents[2] / "db" / "microvest.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


class SavingsGoalCreate(BaseModel):
    title: str
    target_amount: float = Field(gt=0)
    deadline: date | None = None


class ContributionCreate(BaseModel):
    amount: float = Field(gt=0)


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS savings_goals (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                target_amount REAL NOT NULL,
                current_amount REAL NOT NULL DEFAULT 0,
                deadline TEXT,
                created_at TEXT NOT NULL,
                user_id TEXT
            )
        """)

        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(savings_goals)"
            ).fetchall()
        ]

        if "user_id" not in columns:
            connection.execute(
                "ALTER TABLE savings_goals ADD COLUMN user_id TEXT"
            )

        # Preserve existing goals under the original account
        original_user = connection.execute("""
            SELECT id FROM users
            ORDER BY created_at ASC
            LIMIT 1
        """).fetchone()

        if original_user:
            connection.execute("""
                UPDATE savings_goals
                SET user_id = ?
                WHERE user_id IS NULL
            """, (original_user["id"],))

        connection.commit()

    finally:
        connection.close()


initialize_database()


@router.get("/")
def get_savings_goals(
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT id, title, target_amount, current_amount,
                   deadline, created_at
            FROM savings_goals
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (current_user["id"],)).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


@router.post("/")
def create_savings_goal(
    goal: SavingsGoalCreate,
    current_user: dict = Depends(get_current_user)
):
    new_goal = {
        "id": str(uuid4()),
        "title": goal.title,
        "target_amount": goal.target_amount,
        "current_amount": 0,
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "created_at": date.today().isoformat()
    }

    connection = get_connection()

    try:
        connection.execute("""
            INSERT INTO savings_goals
            (id, title, target_amount, current_amount,
             deadline, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            new_goal["id"],
            new_goal["title"],
            new_goal["target_amount"],
            new_goal["current_amount"],
            new_goal["deadline"],
            new_goal["created_at"],
            current_user["id"]
        ))

        connection.commit()

        return {
            "message": "Savings goal created successfully",
            "goal": new_goal
        }

    finally:
        connection.close()


@router.post("/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: str,
    contribution: ContributionCreate,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        goal = connection.execute("""
            SELECT * FROM savings_goals
            WHERE id = ? AND user_id = ?
        """, (goal_id, current_user["id"])).fetchone()

        if not goal:
            raise HTTPException(
                status_code=404,
                detail="Savings goal not found"
            )

        new_amount = goal["current_amount"] + contribution.amount

        connection.execute("""
            UPDATE savings_goals
            SET current_amount = ?
            WHERE id = ? AND user_id = ?
        """, (
            new_amount,
            goal_id,
            current_user["id"]
        ))

        connection.commit()

        return {
            "message": "Contribution added successfully",
            "current_amount": new_amount
        }

    finally:
        connection.close()


@router.delete("/{goal_id}")
def delete_savings_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        cursor = connection.execute("""
            DELETE FROM savings_goals
            WHERE id = ? AND user_id = ?
        """, (goal_id, current_user["id"]))

        connection.commit()

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Savings goal not found"
            )

        return {"message": "Savings goal deleted successfully"}

    finally:
        connection.close()

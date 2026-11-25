
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import date
from pathlib import Path
from uuid import uuid4
import sqlite3

from app.api.routes.auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])

# Permanent SQLite database
DB_PATH = Path(__file__).resolve().parents[2] / "db" / "microvest.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: float
    expense_date: date


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                expense_date TEXT NOT NULL,
                user_id TEXT
            )
        """)

        # Add user_id to existing databases if it is missing
        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(expenses)"
            ).fetchall()
        ]

        if "user_id" not in columns:
            connection.execute(
                "ALTER TABLE expenses ADD COLUMN user_id TEXT"
            )

        # Preserve existing expenses by assigning them to
        # the first registered account (the original account).
        original_user = connection.execute("""
            SELECT id FROM users
            ORDER BY created_at ASC
            LIMIT 1
        """).fetchone()

        if original_user:
            connection.execute("""
                UPDATE expenses
                SET user_id = ?
                WHERE user_id IS NULL
            """, (original_user["id"],))

        connection.commit()

    finally:
        connection.close()


initialize_database()


@router.get("/")
def get_expenses(
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        rows = connection.execute("""
            SELECT id, title, category, amount, expense_date
            FROM expenses
            WHERE user_id = ?
            ORDER BY expense_date DESC
        """, (current_user["id"],)).fetchall()

        return [dict(row) for row in rows]

    finally:
        connection.close()


@router.post("/")
def add_expense(
    expense: ExpenseCreate,
    current_user: dict = Depends(get_current_user)
):
    new_expense = {
        "id": str(uuid4()),
        "title": expense.title,
        "category": expense.category,
        "amount": expense.amount,
        "expense_date": expense.expense_date.isoformat()
    }

    connection = get_connection()

    try:
        connection.execute("""
            INSERT INTO expenses (
                id, title, category, amount, expense_date, user_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            new_expense["id"],
            new_expense["title"],
            new_expense["category"],
            new_expense["amount"],
            new_expense["expense_date"],
            current_user["id"]
        ))

        connection.commit()

        return {
            "message": "Expense added successfully",
            "expense": new_expense
        }

    finally:
        connection.close()


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_user)
):
    connection = get_connection()

    try:
        cursor = connection.execute("""
            DELETE FROM expenses
            WHERE id = ? AND user_id = ?
        """, (expense_id, current_user["id"]))

        connection.commit()

        if cursor.rowcount > 0:
            return {"message": "Expense deleted successfully"}

        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    finally:
        connection.close()

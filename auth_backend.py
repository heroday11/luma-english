"""SQLite accounts, signed sessions, and per-account study progress."""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


SESSION_SECONDS = 30 * 24 * 60 * 60
PASSWORD_ITERATIONS = 600_000
COOKIE_NAME = "study_session"


class AccountError(Exception):
    def __init__(self, status: int, message: str, code: str | None = None):
        self.status = status
        self.message = message
        self.code = code
        super().__init__(message)


class AccountStore:
    def __init__(self, database_path: Path):
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY, value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL REFERENCES accounts(id),
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS session_expiration ON sessions(expires_at);
                CREATE TABLE IF NOT EXISTS progress (
                    account_id TEXT PRIMARY KEY REFERENCES accounts(id),
                    data TEXT NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS recovery_codes (
                    account_id TEXT PRIMARY KEY REFERENCES accounts(id),
                    code_hash TEXT NOT NULL
                );
                """
            )
            connection.execute(
                "INSERT OR IGNORE INTO settings(key, value) VALUES('session_secret', ?)",
                (secrets.token_hex(32),),
            )
            self._session_secret = bytes.fromhex(
                connection.execute("SELECT value FROM settings WHERE key='session_secret'").fetchone()[0]
            )

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        connection = sqlite3.connect(self.database_path, timeout=15)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    @staticmethod
    def _email(value: object) -> str:
        if not isinstance(value, str):
            raise AccountError(400, "请输入有效邮箱")
        email = value.strip().lower()
        if len(email) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            raise AccountError(400, "请输入有效邮箱")
        return email

    @staticmethod
    def _password(value: object) -> str:
        if not isinstance(value, str) or not 6 <= len(value) <= 128:
            raise AccountError(400, "密码需为 6–128 个字符")
        return value

    @staticmethod
    def _hash_password(password: str, salt: bytes) -> str:
        return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS).hex()

    @staticmethod
    def _public_account(account: sqlite3.Row) -> dict:
        return {key: account[key] for key in ("id", "name", "email")}

    def register(self, data: dict) -> tuple[dict, str]:
        name = data.get("name")
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 24:
            raise AccountError(400, "昵称需为 1–24 个字符")
        email = self._email(data.get("email"))
        password = self._password(data.get("password"))
        account_id = uuid.uuid4().hex
        salt = secrets.token_bytes(32)
        digest = self._hash_password(password, salt)
        try:
            with self._connect() as connection:
                connection.execute(
                    "INSERT INTO accounts VALUES(?, ?, ?, ?, ?, ?)",
                    (account_id, name.strip(), email, salt.hex(), digest, int(time.time())),
                )
        except sqlite3.IntegrityError:
            raise AccountError(409, "这个邮箱已注册，请直接登录") from None
        account = {"id": account_id, "name": name.strip(), "email": email}
        return account, self._issue_session(account_id)

    def login(self, data: dict) -> tuple[dict, str]:
        email = self._email(data.get("email"))
        password = self._password(data.get("password"))
        with self._connect() as connection:
            account = connection.execute("SELECT * FROM accounts WHERE email = ?", (email,)).fetchone()
        # Run the same expensive derivation for an unknown email as for a known one.
        salt = bytes.fromhex(account["password_salt"]) if account else bytes(32)
        digest = self._hash_password(password, salt)
        if not account or not hmac.compare_digest(digest, account["password_hash"]):
            raise AccountError(401, "邮箱或密码不正确")
        return self._public_account(account), self._issue_session(account["id"])

    def _issue_session(self, account_id: str) -> str:
        token = secrets.token_urlsafe(32)
        signature = hmac.new(self._session_secret, token.encode("ascii"), hashlib.sha256).hexdigest()
        with self._connect() as connection:
            connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (int(time.time()),))
            connection.execute(
                "INSERT INTO sessions VALUES(?, ?, ?)",
                (hashlib.sha256(token.encode("ascii")).hexdigest(), account_id, int(time.time()) + SESSION_SECONDS),
            )
        return f"{token}.{signature}"

    def _token_hash(self, cookie: str | None) -> str | None:
        if not cookie or len(cookie) > 150 or cookie.count(".") != 1:
            return None
        token, signature = cookie.split(".")
        if not re.fullmatch(r"[A-Za-z0-9_-]{43}", token) or not re.fullmatch(r"[a-f0-9]{64}", signature):
            return None
        expected = hmac.new(self._session_secret, token.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return None
        return hashlib.sha256(token.encode("ascii")).hexdigest()

    def account_for_session(self, cookie: str | None) -> dict | None:
        token_hash = self._token_hash(cookie)
        if not token_hash:
            return None
        with self._connect() as connection:
            account = connection.execute(
                "SELECT accounts.id, accounts.name, accounts.email FROM sessions "
                "JOIN accounts ON accounts.id = sessions.account_id "
                "WHERE sessions.token_hash = ? AND sessions.expires_at > ?",
                (token_hash, int(time.time())),
            ).fetchone()
        return self._public_account(account) if account else None

    def logout(self, cookie: str | None) -> None:
        token_hash = self._token_hash(cookie)
        if token_hash:
            with self._connect() as connection:
                connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))

    def get_progress(self, account_id: str) -> dict:
        with self._connect() as connection:
            row = connection.execute("SELECT data FROM progress WHERE account_id = ?", (account_id,)).fetchone()
        return json.loads(row["data"]) if row else {}

    def create_recovery_code(self, account_id: str) -> str:
        code = secrets.token_hex(16).upper()
        with self._connect() as connection:
            connection.execute('INSERT OR REPLACE INTO recovery_codes VALUES (?, ?)', (account_id, hashlib.sha256(code.encode()).hexdigest()))
        return '-'.join(code[i:i+8] for i in range(0, len(code), 8))

    def recover(self, data: dict) -> tuple[dict, str]:
        email = self._email(data.get('email'))
        password = self._password(data.get('password'))
        code = str(data.get('recoveryCode', '')).replace('-', '').strip().upper()
        digest = hashlib.sha256(code.encode()).hexdigest()
        with self._connect() as connection:
            row = connection.execute('SELECT a.*, r.code_hash FROM accounts a JOIN recovery_codes r ON a.id=r.account_id WHERE a.email=?', (email,)).fetchone()
            if not row or not hmac.compare_digest(row['code_hash'], digest):
                raise AccountError(401, '邮箱或恢复码不正确')
            salt = secrets.token_bytes(32)
            connection.execute('UPDATE accounts SET password_salt=?, password_hash=? WHERE id=?', (salt.hex(), self._hash_password(password, salt), row['id']))
            connection.execute('DELETE FROM recovery_codes WHERE account_id=?', (row['id'],))
            connection.execute('DELETE FROM sessions WHERE account_id=?', (row['id'],))
        return self._public_account(row), self._issue_session(row['id'])

    def set_progress(self, account_id: str, data: dict, base_revision: int = 0) -> dict:
        with self._connect() as connection:
            connection.execute('BEGIN IMMEDIATE')
            row = connection.execute('SELECT data FROM progress WHERE account_id=?', (account_id,)).fetchone()
            current = json.loads(row['data']) if row else {}
            revision = current.get('_serverRevision', 0)
            if base_revision != revision:
                raise AccountError(409, '另一窗口更新了进度，正在合并记录', 'PROGRESS_CONFLICT')
            data = {**data, '_serverRevision': revision+1}
            connection.execute(
                "INSERT INTO progress(account_id, data, updated_at) VALUES(?, ?, ?) "
                "ON CONFLICT(account_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
                (account_id, json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False), int(time.time())),
            )
        return data

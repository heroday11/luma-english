"""Account-isolated English tutoring through the official DSH stdio protocol."""
from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
import tempfile
import threading
import time
import uuid
from contextlib import contextmanager
from pathlib import Path

from auth_backend import AccountError

ROOT = Path(__file__).resolve().parent
DSH_VERSION = '0.2.1-alpha.2'
MODES = {'diagnosis', 'reading', 'vocabulary', 'writing', 'conversation', 'transfer-review'}
SKILLS = ['english-' + name for name in sorted(MODES)]
CHALLENGES = json.loads((ROOT / 'integrations/dsh/challenges.json').read_text(encoding='utf-8'))


def config_status(data_dir: Path) -> dict:
    config = {}
    try:
        config = json.loads((data_dir / 'ai-config.local.json').read_text(encoding='utf-8-sig'))
    except (OSError, ValueError):
        pass
    configured = bool(os.environ.get('DEEPSEEK_API_KEY') or config.get('protectedApiKey'))
    installed = (ROOT / 'node_modules/@deepseek-ai/dsh/lib/bin.js').is_file()
    return {'configured': configured, 'installed': installed, 'ready': configured and installed,
            'version': DSH_VERSION, 'provider': 'DeepSeek 官方 API',
            'model': config.get('model', 'deepseek-flash'), 'skills': SKILLS}


def model_environment(data_dir: Path) -> tuple[dict, str]:
    env = dict(os.environ)
    status = config_status(data_dir)
    if not status['installed']:
        raise AccountError(503, 'DSH 尚未安装，请运行 npm install。', 'DSH_NOT_INSTALLED')
    if not env.get('DEEPSEEK_API_KEY'):
        config_path = data_dir / 'ai-config.local.json'
        if not config_path.is_file() or os.name != 'nt':
            raise AccountError(503, '请先双击“配置AI老师.cmd”填写 DeepSeek API Key。', 'MODEL_NOT_CONFIGURED')
        # Decrypt only inside the current Windows user's process. Never log stdout.
        script = "$c=Get-Content -LiteralPath $env:WORDTRAIL_CONFIG -Raw|ConvertFrom-Json; $s=ConvertTo-SecureString $c.protectedApiKey; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try{[Console]::Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p)}"
        try:
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script],
                env={**env, 'WORDTRAIL_CONFIG': str(config_path)}, capture_output=True, text=True,
                timeout=15, creationflags=subprocess.CREATE_NO_WINDOW)
            if result.returncode or not result.stdout.strip():
                raise ValueError('Cannot decrypt')
            env['DEEPSEEK_API_KEY'] = result.stdout.strip()
        except (OSError, ValueError, subprocess.TimeoutExpired):
            raise AccountError(503, '无法读取本机密钥，请重新运行“配置AI老师.cmd”。', 'MODEL_NOT_CONFIGURED') from None
    # This integration is explicitly configured for the official provider.
    env['DEEPSEEK_BASE_URL'] = 'https://api.deepseek.com/anthropic'
    env.pop('WORDTRAIL_TEST_DIAGNOSTICS', None)
    return env, status['model']


def run_dsh(context: dict, data_dir: Path) -> dict:
    env, model = model_environment(data_dir)
    node = shutil.which('node')
    if not node:
        raise AccountError(503, '未找到 Node.js，无法启动 DSH。', 'DSH_NOT_INSTALLED')
    context = {**context, 'model': model}
    runtime_dir = data_dir / 'dsh'
    runtime_dir.mkdir(parents=True, exist_ok=True)
    env['WORDTRAIL_DSH_HOME'] = str(runtime_dir / 'home')
    with tempfile.TemporaryDirectory(prefix='turn-', dir=runtime_dir) as folder:
        path = Path(folder) / 'context.json'
        path.write_text(json.dumps(context, ensure_ascii=False), encoding='utf-8')
        try:
            process = subprocess.run([node, str(ROOT / 'integrations/dsh/bridge.mjs'), str(path)],
                cwd=ROOT, env=env, capture_output=True, text=True, encoding='utf-8', timeout=125,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
            result = json.loads(process.stdout)
        except (OSError, ValueError, subprocess.TimeoutExpired):
            raise AccountError(503, 'AI 老师暂时未连接成功，你的输入已保留。请稍后重试。', 'DSH_UNAVAILABLE') from None
    if not result.get('ok'):
        messages = {'MODEL_AUTH_FAILED': 'DeepSeek 密钥无效或已失效，请重新配置。',
                    'MODEL_QUOTA': 'DeepSeek 服务额度不足或请求过多，请检查账户后重试。',
                    'MODEL_TIMEOUT': 'DeepSeek 响应超时，你的输入已保留，请稍后重试。'}
        code = result.get('code', 'DSH_RUNTIME_ERROR')
        raise AccountError(503, messages.get(code, 'DSH 未完成本次教学，请稍后重试。'), code)
    return result


class TutorStore:
    def __init__(self, data_dir: Path, runner=run_dsh):
        self.data_dir = data_dir.resolve()
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.path = self.data_dir / 'tutor.sqlite3'
        self.runner = runner
        self.gate = threading.BoundedSemaphore(2)
        self.locks: dict[str, threading.Lock] = {}
        self.lock_guard = threading.Lock()
        with self.connect() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS sessions(
                  id TEXT PRIMARY KEY, owner TEXT NOT NULL, mode TEXT NOT NULL,
                  goal TEXT NOT NULL, minutes INTEGER NOT NULL, created REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS turns(
                  id TEXT PRIMARY KEY, session_id TEXT NOT NULL, role TEXT NOT NULL,
                  text TEXT NOT NULL, created REAL NOT NULL, status TEXT NOT NULL);
                CREATE INDEX IF NOT EXISTS turns_session ON turns(session_id, created);
                CREATE TABLE IF NOT EXISTS checks(
                  owner TEXT NOT NULL, challenge TEXT NOT NULL, answer INTEGER NOT NULL,
                  correct INTEGER NOT NULL, created REAL NOT NULL, PRIMARY KEY(owner,challenge));
            ''')
            # Interrupted requests are retryable on the next application start.
            db.execute("UPDATE turns SET status='failed' WHERE status='pending'")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def status(self):
        return config_status(self.data_dir)

    def owned(self, db, owner, sid):
        row = db.execute('SELECT * FROM sessions WHERE id=? AND owner=?', (sid, owner)).fetchone()
        if not row:
            raise AccountError(404, '找不到这次学习。')
        return dict(row)

    def list_sessions(self, owner):
        with self.connect() as db:
            return [dict(row) for row in db.execute('SELECT * FROM sessions WHERE owner=? ORDER BY created DESC LIMIT 30', (owner,))]

    def create(self, owner, data):
        mode = data.get('mode', 'reading')
        goal = data.get('goal', '提升考研英语二阅读理解')
        minutes = data.get('minutes', 20)
        if not isinstance(mode, str) or mode not in MODES or not isinstance(goal, str) or not 1 <= len(goal.strip()) <= 300:
            raise AccountError(400, '请选择学习方式并填写 1–300 字的目标。')
        if type(minutes) is not int or not 5 <= minutes <= 60:
            raise AccountError(400, '学习时间应在 5–60 分钟之间。')
        sid = str(uuid.uuid4())
        with self.connect() as db:
            db.execute('INSERT INTO sessions VALUES(?,?,?,?,?,?)', (sid, owner, mode, goal.strip(), minutes, time.time()))
        return self.session(owner, sid)

    def session(self, owner, sid):
        with self.connect() as db:
            session = self.owned(db, owner, sid)
            session['turns'] = [dict(row) for row in db.execute('SELECT id,role,text,created,status FROM turns WHERE session_id=? ORDER BY created,rowid', (sid,))]
            return session

    def challenge(self, owner, now=None):
        now = time.time() if now is None else now
        with self.connect() as db:
            rows = {row['challenge']: dict(row) for row in db.execute('SELECT * FROM checks WHERE owner=?', (owner,))}
        baseline = rows.get(CHALLENGES[0]['id'])
        idx = 0 if baseline is None else 1
        task = CHALLENGES[idx]
        done = rows.get(task['id'])
        due = baseline['created'] + 86400 if baseline else now
        public = {k:v for k,v in task.items() if k not in ('answer','explanation')}
        available = now >= due
        # Future transfer content is withheld, not merely hidden by the browser.
        if not available:
            public = {'id':task['id'], 'title':task['title'], 'stage':'transfer'}
        return {'task':public, 'available':available and not done, 'dueAt':due,
                'done': bool(done), 'result': {'correct':bool(done['correct']), 'explanation':task['explanation']} if done else None,
                'history':[{'challenge':row['challenge'],'correct':bool(row['correct']),'created':row['created']} for row in rows.values()],
                'note':'教学补充材料；两道小测仅提供局部证据，不是等级测评。'}

    def answer_challenge(self, owner, data, now=None):
        now = time.time() if now is None else now
        current = self.challenge(owner, now)
        if data.get('id') != current['task']['id'] or not current['available']:
            raise AccountError(409, '这道小测已提交或尚未到复测时间。')
        answer = data.get('answer')
        task = next(t for t in CHALLENGES if t['id'] == data['id'])
        if type(answer) is not int or not 0 <= answer < len(task['options']):
            raise AccountError(400, '请选择一个选项。')
        with self.connect() as db:
            try:
                db.execute('INSERT INTO checks VALUES(?,?,?,?,?)', (owner, task['id'], answer, int(answer == task['answer']), now))
            except sqlite3.IntegrityError:
                raise AccountError(409, '这道小测已经提交。') from None
        return {'correct':answer == task['answer'], 'explanation':task['explanation'], 'next':self.challenge(owner, now)}

    def message(self, owner, data, progress):
        sid, request_id, text = data.get('sessionId'), data.get('requestId'), data.get('text')
        if not isinstance(sid, str) or not isinstance(request_id, str) or not re.fullmatch(r'[a-zA-Z0-9-]{16,80}', request_id):
            raise AccountError(400, '学习请求编号无效。')
        if not isinstance(text, str) or not 1 <= len(text.strip()) <= 4000:
            raise AccountError(400, '每次请输入 1–4000 字。')
        with self.lock_guard:
            lock = self.locks.setdefault(sid, threading.Lock())
        if not lock.acquire(blocking=False):
            raise AccountError(409, '这次学习还在等待老师回复，请稍候。', 'TUTOR_BUSY')
        if not self.gate.acquire(blocking=False):
            lock.release()
            raise AccountError(429, '老师正在处理其他练习，请稍后重试。', 'TUTOR_BUSY')
        turn_id = sid + ':' + request_id
        try:
            with self.connect() as db:
                session = self.owned(db, owner, sid)
                prior = db.execute('SELECT * FROM turns WHERE id=?', (turn_id,)).fetchone()
                if prior and prior['text'] != text.strip():
                    raise AccountError(409, '重试内容已改变，请使用新的请求编号。')
                if prior and prior['status'] == 'complete':
                    return self.session(owner, sid)
                count = db.execute("SELECT count(*) FROM turns WHERE session_id=? AND role='user'",(sid,)).fetchone()[0]
                if count >= 40 and not prior:
                    raise AccountError(400, '本次学习已达 40 轮，请开始新的学习。')
                if prior:
                    db.execute("UPDATE turns SET status='pending' WHERE id=?", (turn_id,))
                else:
                    db.execute('INSERT INTO turns VALUES(?,?,?,?,?,?)', (turn_id,sid,'user',text.strip(),time.time(),'pending'))
                history = [dict(r) for r in db.execute("SELECT role,text FROM turns WHERE session_id=? AND status='complete' ORDER BY created DESC LIMIT 12", (sid,))][::-1]
            now_ms = time.time()*1000
            cards = progress.get('cards', {})
            due = progress.get('due', {})
            attempts = progress.get('reviewEvents', [])
            cards = cards if isinstance(cards, dict) else {}
            due = due if isinstance(due, dict) else {}
            attempts = attempts if isinstance(attempts, list) else []
            context = {'runtimeSessionId':'wt-' + uuid.uuid4().hex, 'goal':session['goal'], 'minutes':session['minutes'],
                'mode':session['mode'], 'history':history,
                'evidence':{'dueCount':sum(1 for value in due.values() if isinstance(value,(int,float)) and 0 < value <= now_ms),
                            'cardCount':len(cards), 'recentAttempts':[
                                {k: e.get(k) for k in ('kind','correct','hinted','retry','responseMs')} for e in attempts[-20:] if isinstance(e,dict)]},
                'readingCheck': self.challenge(owner)['history'],
                'prompt':f'Use the english-{session["mode"]} skill. Read education_context for the previous conversation and learning evidence. The learner now says:\n{text.strip()}'}
            try:
                result = self.runner(context, self.data_dir)
                response = result.get('text')
                if not isinstance(response,str) or not response.strip():
                    raise AccountError(503, 'AI 返回了空回复，请重试。')
            except Exception as error:
                with self.connect() as db:
                    db.execute("UPDATE turns SET status='failed' WHERE id=?",(turn_id,))
                if isinstance(error, AccountError):
                    raise
                raise AccountError(503, 'AI 服务暂不可用，你的输入已保留。', 'DSH_UNAVAILABLE') from None
            with self.connect() as db:
                db.execute('INSERT INTO turns VALUES(?,?,?,?,?,?)', (turn_id+':reply',sid,'assistant',response,time.time(),'complete'))
                db.execute("UPDATE turns SET status='complete' WHERE id=?",(turn_id,))
            return self.session(owner, sid)
        finally:
            self.gate.release()
            lock.release()

"""Local study server with accounts, persistent progress, and fixed content proxies."""

from __future__ import annotations

import json
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from http.cookies import CookieError, SimpleCookie
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote, unquote, urlencode, urlsplit
from urllib.request import Request, urlopen

from auth_backend import AccountError, AccountStore, COOKIE_NAME, SESSION_SECONDS
from online_audio import generate as generate_audio, CACHE as AUDIO_CACHE
from tutor_backend import TutorStore


ROOT = Path(__file__).resolve().parent
CACHE: dict[str, bytes] = {}
CACHE_LOCK = threading.Lock()
MAX_BODY_BYTES = 8_000_000


def reject_json_constant(value: str):
    raise ValueError(f"Invalid JSON constant: {value}")


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status: int, data: dict, cookie: str | None = None) -> None:
        body = json.dumps(data, ensure_ascii=False, allow_nan=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if cookie is not None:
            max_age = SESSION_SECONDS if cookie else 0
            self.send_header("Set-Cookie", f"{COOKIE_NAME}={cookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age={max_age}")
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, status: int, message: str, code: str | None = None) -> None:
        data = {"error": message}
        if code:
            data["code"] = code
            if code == "ACCOUNT_MISMATCH":
                data["accountMismatch"] = True
        self._json(status, data)

    def _local_request(self, mutation: bool = False) -> bool:
        # This server runs on loopback; reject DNS rebinding and cross-origin writes.
        host = self.headers.get("Host", "")
        expected_hosts = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
        if host not in expected_hosts:
            self._json_error(403, "仅支持本机访问")
            return False
        origin = self.headers.get("Origin")
        if mutation and origin and origin not in {f"http://{host}" for host in expected_hosts}:
            self._json_error(403, "请求来源无效")
            return False
        return True

    def _session_cookie(self) -> str | None:
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get("Cookie", ""))
        except CookieError:
            return None
        item = cookies.get(COOKIE_NAME)
        return item.value if item else None

    def _account(self) -> dict:
        account = self.server.accounts.account_for_session(self._session_cookie())
        if not account:
            raise AccountError(401, "请先登录")
        return account

    def _progress_account(self) -> dict:
        account = self._account()
        # Browser tabs share session cookies, but each tab may still display a
        # different account. Never read or write progress under a changed cookie.
        expected = self.headers.get("X-Study-Account", "")
        if expected != account["id"]:
            raise AccountError(409, "账号已在其他窗口切换", "ACCOUNT_MISMATCH")
        return account

    def _read_json(self) -> dict:
        if self.headers.get("Content-Type", "").split(";")[0].strip().lower() != "application/json":
            raise AccountError(415, "请使用 JSON 提交")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise AccountError(400, "请求长度无效") from None
        if not 0 < length <= MAX_BODY_BYTES:
            raise AccountError(413 if length > MAX_BODY_BYTES else 400, "请求内容为空或过大")
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"), parse_constant=reject_json_constant)
        except (ValueError, UnicodeDecodeError, RecursionError):
            raise AccountError(400, "JSON 内容无效") from None
        if not isinstance(data, dict):
            raise AccountError(400, "请求内容需为对象")
        return data

    def send_head(self):
        # SimpleHTTP's default file handler would otherwise expose the SQLite database.
        resolved = Path(self.translate_path(self.path)).resolve()
        database_directory = self.server.accounts.database_path.parent.resolve()
        if resolved == database_directory or database_directory in resolved.parents:
            self.send_error(403, "Private data")
            return None
        if any(part.startswith('.') for part in resolved.relative_to(ROOT).parts) if resolved.is_relative_to(ROOT) else True:
            self.send_error(403, "Private data")
            return None
        # Serve learning assets only; source, plugins, checks and dependencies are private.
        public_files = {'index.html', 'app.js', 'audio-player.js', 'content-engine.js',
                        'memory-engine.js', 'visuals.js', 'tutor.js', 'tutor.css',
                        'styles.css', 'upgrades.css', 'exam_vocab.json', 'learning-content.json',
                        'local-dictionary.json', 'recovered-content.json',
                        'DICTIONARY-NOTICE.txt', 'OPEN-SOURCE-NOTICE.txt'}
        relative = resolved.relative_to(ROOT).as_posix()
        if resolved == ROOT:
            self.path = '/index.html'
        elif relative not in public_files and relative != 'vendor/index.umd.js':
            self.send_error(403, "Private application file")
            return None
        return super().send_head()

    def do_HEAD(self) -> None:
        if self._local_request():
            super().do_HEAD()

    def _proxy(self, cache_key: str, url: str) -> None:
        with CACHE_LOCK:
            body = CACHE.get(cache_key)
        if body is None:
            request = Request(url, headers={"User-Agent": "VocabularyStudyRoom/1.0 (local preview)"})
            try:
                with urlopen(request, timeout=10) as response:
                    body = response.read(2_000_000)
            except (HTTPError, URLError, TimeoutError) as error:
                self._json_error(502, f"外部词典暂不可用: {error}")
                return
            try:
                parsed = json.loads(body)
                valid = not isinstance(parsed, dict) or not parsed.get('error')
                if cache_key.startswith('translation:'):
                    valid = parsed.get('responseStatus') == 200 and not re.search(r'QUOTA|WARNING', parsed.get('responseData', {}).get('translatedText', ''), re.I)
                if not valid:
                    self._json_error(502, "在线内容暂不可用，请稍后重试")
                    return
            except (ValueError, AttributeError):
                self._json_error(502, "在线内容格式异常，请稍后重试")
                return
            with CACHE_LOCK:
                CACHE[cache_key] = body
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "public, max-age=86400")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if not self._local_request():
            return
        parsed = urlsplit(self.path)
        if parsed.path.startswith('/api/tutor/'):
            try:
                if parsed.path == '/api/tutor/status':
                    self._json(200, self.server.tutor.status())
                    return
                account = self._progress_account()
                if parsed.path == '/api/tutor/sessions':
                    self._json(200, {'sessions': self.server.tutor.list_sessions(account['id'])})
                elif parsed.path == '/api/tutor/session':
                    self._json(200, self.server.tutor.session(account['id'], parse_qs(parsed.query).get('id',[''])[0]))
                elif parsed.path == '/api/tutor/challenge':
                    self._json(200, self.server.tutor.challenge(account['id']))
                else:
                    self._json_error(404, '接口不存在')
            except AccountError as error:
                self._json_error(error.status, error.message, error.code)
            return
        if re.fullmatch(r"/api/audio/[a-f0-9]{64}\.mp3", parsed.path):
            audio = AUDIO_CACHE / parsed.path.rsplit('/', 1)[-1]
            if not audio.is_file():
                self._json_error(404, "音频缓存不存在，请重新生成")
                return
            body = audio.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
            self.end_headers()
            self.wfile.write(body)
            return
        if parsed.path == "/api/auth/me":
            self._json(200, {"account": self.server.accounts.account_for_session(self._session_cookie())})
            return
        if parsed.path == "/api/progress":
            try:
                account = self._progress_account()
                stored = self.server.accounts.get_progress(account["id"])
                self._json(200, {"data": stored, "revision": stored.get('_serverRevision', 0)})
            except AccountError as error:
                self._json_error(error.status, error.message, error.code)
            return
        if parsed.path.startswith("/api/dictionary/"):
            word = unquote(parsed.path.removeprefix("/api/dictionary/")).strip()
            if not re.fullmatch(r"[A-Za-z][A-Za-z' -]*", word):
                self._json_error(400, "无效的单词")
                return
            self._proxy(f"dictionary:{word.lower()}", f"https://api.dictionaryapi.dev/api/v2/entries/en/{quote(word)}")
            return
        if parsed.path == "/api/translate":
            text = parse_qs(parsed.query).get("text", [""])[0].strip()
            if not text or len(text) > 480:
                self._json_error(400, "翻译文本为空或过长")
                return
            query = urlencode({"q": text, "langpair": "en|zh-CN"})
            self._proxy(f"translation:{text}", f"https://api.mymemory.translated.net/get?{query}")
            return
        if parsed.path == "/api/images":
            word = parse_qs(parsed.query).get("word", [""])[0].strip()
            if not 1 <= len(word) <= 80 or not re.fullmatch(r"[A-Za-z][A-Za-z' -]*", word):
                self._json_error(400, "无效的单词")
                return
            query = urlencode({
                "action": "query", "format": "json", "generator": "search",
                "gsrsearch": f"{word} filetype:bitmap", "gsrnamespace": 6, "gsrlimit": 3,
                "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 800,
            })
            self._proxy(f"images:{word.lower()}", f"https://commons.wikimedia.org/w/api.php?{query}")
            return
        super().do_GET()

    def do_POST(self) -> None:
        if not self._local_request(mutation=True):
            return
        path = urlsplit(self.path).path
        try:
            if path.startswith('/api/tutor/'):
                account = self._progress_account()
                data = self._read_json()
                if path == '/api/tutor/sessions':
                    self._json(200, self.server.tutor.create(account['id'], data))
                elif path == '/api/tutor/message':
                    progress = self.server.accounts.get_progress(account['id'])
                    self._json(200, self.server.tutor.message(account['id'], data, progress))
                elif path == '/api/tutor/challenge':
                    self._json(200, self.server.tutor.answer_challenge(account['id'], data))
                else:
                    self._json_error(404, '接口不存在')
            elif path == "/api/tts":
                data = self._read_json()
                try:
                    self._json(200, generate_audio(data.get('text', ''), data.get('voice', 'en-US-AriaNeural'), data.get('rate', 1)))
                except (ValueError, TypeError):
                    self._json_error(400, "语音文字、音色或语速无效")
                except Exception:
                    self._json_error(503, "免费在线语音暂时连接失败，请重试。已缓存的音频仍可播放。")
            elif path == "/api/auth/recovery-code":
                account = self._progress_account()
                self._json(200, {'recoveryCode': self.server.accounts.create_recovery_code(account['id'])})
            elif path == "/api/auth/recover":
                data = self._read_json()
                account, cookie = self.server.accounts.recover(data)
                self._json(200, {'account': account}, cookie=cookie)
            elif path == "/api/auth/logout":
                expected = self.headers.get("X-Study-Account")
                current = self.server.accounts.account_for_session(self._session_cookie())
                if expected is not None and current and expected != current["id"]:
                    raise AccountError(409, "账号已在其他窗口切换", "ACCOUNT_MISMATCH")
                self.server.accounts.logout(self._session_cookie())
                self._json(200, {"account": None}, cookie="")
            elif path in {"/api/auth/register", "/api/auth/login"}:
                data = self._read_json()
                action = self.server.accounts.register if path.endswith("register") else self.server.accounts.login
                account, cookie = action(data)
                self._json(200, {"account": account}, cookie=cookie)
            else:
                self._json_error(404, "接口不存在")
        except AccountError as error:
            self._json_error(error.status, error.message, error.code)

    def do_PUT(self) -> None:
        if not self._local_request(mutation=True):
            return
        if urlsplit(self.path).path != "/api/progress":
            self._json_error(404, "接口不存在")
            return
        try:
            account = self._progress_account()
            submitted = self._read_json()
            data = submitted.get("data")
            if not isinstance(data, dict):
                raise AccountError(400, "学习进度需为对象")
            saved = self.server.accounts.set_progress(account["id"], data, submitted.get('baseRevision', 0))
            self._json(200, {"data": saved, "revision": saved['_serverRevision']})
        except AccountError as error:
            self._json_error(error.status, error.message, error.code)


class StudyHTTPServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, address: tuple[str, int], database_path: Path | None = None):
        self.accounts = AccountStore(database_path or ROOT / ".study-data" / "accounts.sqlite3")
        self.tutor = TutorStore(self.accounts.database_path.parent)
        super().__init__(address, PreviewHandler)


if __name__ == "__main__":
    server = StudyHTTPServer(("127.0.0.1", 8765))
    print("Vocabulary preview ready at http://127.0.0.1:8765/")
    server.serve_forever()

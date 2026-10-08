#!/usr/bin/env python3
"""Публикация Reels в Instagram через официальный API (Instagram API with Instagram Login).

Ключи берутся из окружения (IG_ACCESS_TOKEN, IG_USER_ID) или из файла .env в корне проекта.
Токен нигде не печатается.

    python tools/publish_instagram.py check
    python tools/publish_instagram.py publish --video out/reel.mp4 --caption-file content/caption.txt [--dry-run] [--yes]
    python tools/publish_instagram.py refresh

Instagram принимает Reels только по публичной ссылке, поэтому скрипт поднимает локальный
сервер и открывает временный туннель Cloudflare (нужен cloudflared) либо берёт готовую ссылку (--video-url).
"""
from __future__ import annotations

import argparse
import atexit
import os
import queue
import re
import subprocess
import sys
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import NoReturn

import requests

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"
MAX_CAPTION = 2200
MAX_HASHTAGS = 30
MAX_VIDEO_BYTES = 300 * 1024 * 1024
TUNNEL_URL = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")
REFRESH_URL = "https://graph.instagram.com/refresh_access_token"


class IGError(Exception):
    """Ошибка Instagram API с понятным пояснением."""


def die(message: str, code: int = 1) -> NoReturn:
    print(f"\n✗ {message}", file=sys.stderr)
    sys.exit(code)


def load_env(path: Path = ENV_PATH) -> None:
    """Читает .env, не перезаписывая уже заданные переменные окружения."""
    if not path.exists():
        return  # в CI ключи приходят из окружения (GitHub Secrets)
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key, value = key.strip(), value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        os.environ.setdefault(key, value)


def hint_for(error: dict) -> str | None:
    code, sub = error.get("code"), error.get("error_subcode")
    message = error.get("message") or ""
    if code == 190:
        return ("Токен недействителен или истёк. Сгенерируй новый в Meta for Developers "
                "(Настройка API → Сгенерировать маркер) и обнови IG_ACCESS_TOKEN.")
    if code in (10, 200) or re.search("permission", message, re.I):
        return ("Не хватает прав. Нужно instagram_business_content_publish: добавь его в "
                "«Разрешения и функции» и сгенерируй токен заново.")
    if code in (4, 17, 32, 613):
        return "Лимит запросов. Подожди и повтори позже."
    if code == 9 or sub == 2207042:
        return "Достигнут суточный лимит публикаций."
    if sub == 2207026:
        return "Неподдерживаемый формат видео. Нужен mp4 (H.264 + AAC), вертикальный 9:16."
    return None


class Instagram:
    """Тонкий клиент Instagram Graph API. Токен скрывается во всех сообщениях об ошибках."""

    def __init__(self, token: str, user_id: str) -> None:
        self.token = token
        self.user_id = user_id
        version = os.environ.get("IG_API_VERSION", "v23.0")
        base = os.environ.get("IG_GRAPH_BASE") or f"https://graph.instagram.com/{version}"
        self.base = base.rstrip("/")
        self.session = requests.Session()

    def redact(self, text: object) -> str:
        text = str(text)
        return text.replace(self.token, "***") if self.token else text

    def request(self, method: str, url: str, **kwargs) -> dict:
        try:
            response = self.session.request(method, url, timeout=60, **kwargs)
        except requests.RequestException as exc:
            # в тексте исключения requests бывает URL с токеном, поэтому берём только тип ошибки
            raise IGError(f"Нет связи с Instagram API: {type(exc).__name__}") from None
        try:
            data = response.json()
        except ValueError:
            data = {"raw": response.text[:500]}
        if not response.ok or (isinstance(data, dict) and "error" in data):
            error = data.get("error") or {} if isinstance(data, dict) else {}
            message = self.redact(error.get("message") or data.get("raw") or f"HTTP {response.status_code}")
            code = error.get("code", response.status_code)
            sub = error.get("error_subcode")
            text = f"Instagram API: {message} (код {code}{'/' + str(sub) if sub else ''})"
            hint = hint_for(error)
            if hint:
                text += f"\n  → {hint}"
            raise IGError(text)
        return data

    def get(self, path: str, **params) -> dict:
        return self.request("GET", f"{self.base}/{path}", params={**params, "access_token": self.token})

    def post(self, path: str, **form) -> dict:
        return self.request("POST", f"{self.base}/{path}", data={**form, "access_token": self.token})


# ---------- раздача видео по публичной ссылке ----------

def make_handler(video: Path):
    """HTTP-обработчик, отдающий один файл с поддержкой Range (Instagram качает кусками)."""
    size = video.stat().st_size

    class VideoHandler(BaseHTTPRequestHandler):
        def log_message(self, *args) -> None:  # тишина в логах
            pass

        def _serve(self, send_body: bool) -> None:
            start, end, status = 0, size - 1, 200
            match = re.match(r"bytes=(\d*)-(\d*)", self.headers.get("Range") or "")
            if match:
                first, last = match.groups()
                if first == "" and last != "":
                    start, end = max(size - int(last), 0), size - 1
                else:
                    if first != "":
                        start = int(first)
                    if last != "":
                        end = min(int(last), size - 1)
                status = 206
            if start > end or start >= size:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            self.send_response(status)
            self.send_header("Content-Type", "video/mp4")
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(end - start + 1))
            if status == 206:
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.end_headers()
            if not send_body:
                return
            try:
                with video.open("rb") as handle:
                    handle.seek(start)
                    remaining = end - start + 1
                    while remaining > 0:
                        chunk = handle.read(min(65536, remaining))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self) -> None:
            self._serve(True)

        def do_HEAD(self) -> None:
            self._serve(False)

    return VideoHandler


def host_via_tunnel(video: Path) -> str | None:
    """Поднимает локальный сервер и временный туннель Cloudflare, возвращает публичную ссылку."""
    server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(video))
    server.daemon_threads = True
    threading.Thread(target=server.serve_forever, daemon=True).start()
    port = server.server_address[1]

    process, url, diag = None, "", ""
    for binary in ("cloudflared", "/opt/homebrew/bin/cloudflared", "/usr/local/bin/cloudflared"):
        try:
            candidate = subprocess.Popen(
                [binary, "tunnel", "--url", f"http://127.0.0.1:{port}", "--no-autoupdate"],
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1,
            )
        except OSError as exc:
            diag += f"\n{binary}: {type(exc).__name__}"
            continue
        lines: queue.Queue = queue.Queue()

        def reader(proc=candidate, sink=lines) -> None:
            for line in proc.stdout:
                sink.put(line)
            sink.put(None)

        threading.Thread(target=reader, daemon=True).start()
        deadline = time.time() + 40
        while time.time() < deadline and not url:
            try:
                line = lines.get(timeout=1)
            except queue.Empty:
                continue
            if line is None:
                break
            diag = (diag + line)[-1200:]
            found = TUNNEL_URL.search(line)
            if found:
                url = found.group(0)
        if url:
            process = candidate
            break
        candidate.kill()

    def stop() -> None:
        if process is not None:
            try:
                process.terminate()
            except OSError:
                pass
        server.shutdown()

    if not url:
        server.shutdown()
        print("    cloudflared не открыл туннель. Его вывод:")
        for line in diag.splitlines():
            print(f"    > {line}")
        return None

    atexit.register(stop)
    full = f"{url}/{urllib.parse.quote(video.name)}"
    print(f"    туннель открыт: {url}, проверяю доступность…")
    last = ""
    for _ in range(30):
        try:
            head = requests.head(full, timeout=8, allow_redirects=True)
            if head.ok:
                return full
            last = f"HTTP {head.status_code}"
        except requests.RequestException as exc:
            last = type(exc).__name__
        time.sleep(3)
    print(f"    туннель не отвечает с этого компьютера: {last}")
    stop()
    return None


# ---------- команды ----------

def cmd_check(api: Instagram) -> None:
    me = api.get("me", fields="user_id,username,account_type")
    print(f"✓ Токен работает. Аккаунт: @{me.get('username')} ({me.get('account_type') or 'тип неизвестен'})")
    if me.get("user_id") and str(me["user_id"]) != str(api.user_id):
        print(f"  ⚠ IG_USER_ID ({api.user_id}) отличается от user_id из API ({me['user_id']}). "
              "Если публикация не пойдёт, поставь значение из API.")
    try:
        limit = api.get(f"{api.user_id}/content_publishing_limit", fields="quota_usage,config")
        item = (limit.get("data") or [None])[0]
        if item:
            total = (item.get("config") or {}).get("quota_total", "?")
            print(f"  Публикаций за последние 24 часа: {item.get('quota_usage')} из {total}")
    except IGError:
        pass  # необязательная проверка
    print("  Доступ к публикации Reels проверится при первой публикации.")


def cmd_refresh(api: Instagram) -> None:
    data = api.request("GET", REFRESH_URL, params={"grant_type": "ig_refresh_token", "access_token": api.token})
    new_token = data.get("access_token")
    if not new_token:
        die("API не вернул новый токен")
    days = round((data.get("expires_in") or 0) / 86400)
    if ENV_PATH.exists():
        text = ENV_PATH.read_text(encoding="utf-8")
        ENV_PATH.write_text(
            re.sub(r"^(\s*IG_ACCESS_TOKEN\s*=).*$", lambda m: m.group(1) + new_token, text, flags=re.M),
            encoding="utf-8")
        print(f"✓ Токен продлён и записан в .env. Действует ещё примерно {days} дн.")
    elif new_token.strip() == api.token.strip():
        print(f"✓ Токен продлён ещё на ~{days} дн. Значение токена не изменилось, секрет обновлять не нужно.")
    else:
        print(f"  Длина старого токена: {len(api.token)}, нового: {len(new_token)} (сами значения не печатаю).")
        die("Токен продлён, но получил новое значение, а сохранить его некуда (файла .env нет). "
            "Новое значение не печатаю, чтобы оно не попало в журнал. "
            "Старый токен действует до своего срока: выпусти новый в Meta и обнови секрет IG_ACCESS_TOKEN.")


def read_caption(args: argparse.Namespace) -> str:
    if args.caption_file:
        path = Path(args.caption_file).expanduser()
        if not path.exists():
            die(f"Файл описания не найден: {path}")
        return path.read_text(encoding="utf-8").strip()
    return (args.caption or "").strip()


def cmd_publish(api: Instagram, args: argparse.Namespace) -> None:
    video = Path(args.video).expanduser().resolve()
    if not video.exists():
        die(f"Файл не найден: {video}")
    if video.suffix.lower() != ".mp4":
        die("Нужен файл .mp4")
    size = video.stat().st_size
    if size > MAX_VIDEO_BYTES:
        die("Файл больше 300 МБ, Instagram такое не примет")

    caption = read_caption(args)
    if not caption:
        die("Описание пустое")
    if len(caption) > MAX_CAPTION:
        die(f"Описание {len(caption)} символов, максимум {MAX_CAPTION}")
    hashtags = len(re.findall(r"#\w+", caption))
    if hashtags > MAX_HASHTAGS:
        die(f"Хештегов {hashtags}, максимум {MAX_HASHTAGS}")

    print("— Публикация Reel —")
    print(f"Аккаунт ID: {api.user_id}")
    print(f"Видео:      {video} ({size / 1024 / 1024:.1f} МБ)")
    print(f"Хештегов:   {hashtags}, символов в описании: {len(caption)}")
    print("Описание:\n" + "\n".join(f"  | {line}" for line in caption.splitlines()))

    if args.dry_run:
        print("\n✓ Проверка пройдена. Ничего не отправлено (--dry-run).")
        return

    if not args.yes:
        if not sys.stdin.isatty():
            die("Без интерактивного терминала нужен флаг --yes")
        if input("\nОпубликовать? (да/нет): ").strip().lower() not in ("да", "y", "yes", "д"):
            die("Отменено, ничего не опубликовано.", 0)

    print("\n1/4 Готовлю публичную ссылку на видео…")
    video_url = args.video_url
    if video_url:
        print("    (использую готовую ссылку)")
    else:
        video_url = host_via_tunnel(video)
        if not video_url:
            die("Не удалось открыть туннель для видео (подробности выше). Публикация остановлена.")
        print(f"    ссылка: {video_url}")

    print("2/4 Создаю контейнер…")
    form = {
        "media_type": "REELS",
        "caption": caption,
        "share_to_feed": "false" if args.no_feed else "true",
        "video_url": video_url,
    }
    if args.thumb_offset is not None:
        form["thumb_offset"] = str(args.thumb_offset)
    container = api.post(f"{api.user_id}/media", **form)
    container_id = container.get("id")
    if not container_id:
        die("API не вернул id контейнера")

    print("3/4 Жду обработку Instagram…")
    interval = float(os.environ.get("IG_POLL_INTERVAL", "5"))
    status = ""
    for _ in range(90):
        info = api.get(container_id, fields="status_code,status")
        status = info.get("status_code")
        print(f"    статус: {status}", flush=True)
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            die(f"Обработка не удалась ({status}): {api.redact(info.get('status') or '')}")
        time.sleep(interval)
    if status != "FINISHED":
        die("Instagram слишком долго обрабатывает видео. Контейнер не опубликован, повтори позже.")

    print("4/4 Публикую…")
    published = api.post(f"{api.user_id}/media_publish", creation_id=container_id)
    media_id = published.get("id")
    if not media_id:
        die("API не вернул id публикации")
    link = ""
    try:
        link = api.get(media_id, fields="permalink").get("permalink", "")
    except IGError:
        pass  # ссылка необязательна
    print(f"\n✓ Опубликовано. ID: {media_id}" + (f"\n  {link}" if link else ""), flush=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Публикация Reels в Instagram")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("check", help="проверить токен и аккаунт")
    sub.add_parser("refresh", help="продлить токен")
    publish = sub.add_parser("publish", help="опубликовать Reel")
    publish.add_argument("--video", required=True, help="путь к .mp4")
    group = publish.add_mutually_exclusive_group(required=True)
    group.add_argument("--caption-file", help="файл с описанием")
    group.add_argument("--caption", help="текст описания")
    publish.add_argument("--dry-run", action="store_true", help="проверить всё, ничего не отправляя")
    publish.add_argument("--yes", action="store_true", help="не спрашивать подтверждение в терминале")
    publish.add_argument("--no-feed", action="store_true", help="не показывать Reel в ленте профиля")
    publish.add_argument("--thumb-offset", type=int, help="кадр обложки, миллисекунды")
    publish.add_argument("--video-url", help="готовая публичная ссылка вместо туннеля")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    load_env()
    token = os.environ.get("IG_ACCESS_TOKEN", "").strip()
    user_id = os.environ.get("IG_USER_ID", "").strip()
    if not token:
        die("Нет IG_ACCESS_TOKEN (секрет GitHub или файл .env)")
    if not user_id:
        die("Нет IG_USER_ID (секрет GitHub или файл .env)")
    api = Instagram(token, user_id)
    try:
        if args.command == "check":
            cmd_check(api)
        elif args.command == "publish":
            cmd_publish(api, args)
        else:
            cmd_refresh(api)
    except IGError as exc:
        die(str(exc))
    return 0


if __name__ == "__main__":
    sys.exit(main())

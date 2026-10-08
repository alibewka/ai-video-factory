"""Тесты конвейера без сети: поддельный Instagram Graph API на localhost."""
from __future__ import annotations

import contextlib
import io
import json
import os
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock
from urllib.parse import parse_qs, urlparse

import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))

import ci_state  # noqa: E402
import publish_instagram as ig  # noqa: E402

TOKEN = "SECRET-TOKEN-123"


class FakeGraph:
    """Поддельный Instagram Graph API: запоминает запросы и отвечает как настоящий."""

    def __init__(self, polls_before_finished: int = 2, auth_error: bool = False,
                 refresh_token: str | None = None) -> None:
        self.polls_before_finished = polls_before_finished
        self.auth_error = auth_error
        self.refresh_token = refresh_token
        self.calls: list[tuple[str, str, dict]] = []
        self.polled = 0
        fake = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args) -> None:
                pass

            def reply(self, status: int, payload: dict) -> None:
                body = json.dumps(payload).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def handle_request(self, method: str) -> None:
                url = urlparse(self.path)
                params = {k: v[0] for k, v in parse_qs(url.query).items()}
                if method == "POST":
                    length = int(self.headers.get("Content-Length") or 0)
                    params.update({k: v[0] for k, v in parse_qs(self.rfile.read(length).decode()).items()})
                parts = url.path.split("/", 2)
                path = parts[2] if len(parts) > 2 else parts[1]
                fake.calls.append((method, path, params))
                if fake.auth_error:
                    message = f"Invalid OAuth access token {params.get('access_token')}"
                    return self.reply(400, {"error": {"message": message, "code": 190}})
                if (method, path) == ("GET", "me"):
                    return self.reply(200, {"user_id": "42", "username": "tester", "account_type": "MEDIA_CREATOR"})
                if (method, path) == ("GET", "42/content_publishing_limit"):
                    return self.reply(200, {"data": [{"quota_usage": 1, "config": {"quota_total": 100}}]})
                if (method, path) == ("POST", "42/media"):
                    return self.reply(200, {"id": "c1"})
                if (method, path) == ("GET", "c1"):
                    fake.polled += 1
                    done = fake.polled > fake.polls_before_finished
                    return self.reply(200, {"status_code": "FINISHED" if done else "IN_PROGRESS"})
                if (method, path) == ("POST", "42/media_publish"):
                    return self.reply(200, {"id": "555"})
                if (method, path) == ("GET", "555"):
                    return self.reply(200, {"permalink": "https://www.instagram.com/reel/TEST/"})
                if (method, path) == ("GET", "refresh_access_token"):
                    token = fake.refresh_token or params.get("access_token")
                    return self.reply(200, {"access_token": token, "expires_in": 5183944})
                return self.reply(404, {"error": {"message": "not found", "code": 100}})

            def do_GET(self) -> None:
                self.handle_request("GET")

            def do_POST(self) -> None:
                self.handle_request("POST")

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    @property
    def root(self) -> str:
        return f"http://127.0.0.1:{self.server.server_address[1]}"

    @property
    def base(self) -> str:
        return f"http://127.0.0.1:{self.server.server_address[1]}/v23.0"

    def close(self) -> None:
        self.server.shutdown()
        self.server.server_close()

    def called(self, method: str, path: str) -> list[dict]:
        return [params for m, p, params in self.calls if (m, p) == (method, path)]


def run_cli(base: str, *argv: str) -> tuple[int, str, str]:
    env = {
        "IG_ACCESS_TOKEN": TOKEN,
        "IG_USER_ID": "42",
        "IG_GRAPH_BASE": base,
        "IG_POLL_INTERVAL": "0",
        "NO_PROXY": "127.0.0.1,localhost",
    }
    out, err = io.StringIO(), io.StringIO()
    code = 0
    with mock.patch.dict(os.environ, env), contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        try:
            code = ig.main(list(argv))
        except SystemExit as exc:
            code = exc.code if isinstance(exc.code, int) else 1
    return code, out.getvalue(), err.getvalue()


class PublishFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fake = FakeGraph()
        self.addCleanup(self.fake.close)
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.video = self.dir / "reel.mp4"
        self.video.write_bytes(b"\x00\x00\x00\x18ftypmp42" + b"0" * 2048)
        self.caption = self.dir / "caption.txt"
        self.caption.write_text("Тест\n\n#один #два", encoding="utf-8")

    def publish(self, *extra: str) -> tuple[int, str, str]:
        return run_cli(self.fake.base, "publish", "--video", str(self.video),
                       "--caption-file", str(self.caption), *extra)

    def test_check_ok(self) -> None:
        code, out, _ = run_cli(self.fake.base, "check")
        self.assertEqual(code, 0)
        self.assertIn("Токен работает. Аккаунт: @tester", out)
        self.assertIn("1 из 100", out)

    def test_dry_run_sends_nothing(self) -> None:
        code, out, _ = self.publish("--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("Ничего не отправлено", out)
        self.assertEqual(self.fake.calls, [])

    def test_full_publish_flow(self) -> None:
        code, out, err = self.publish("--yes", "--video-url", "https://example.com/reel.mp4")
        self.assertEqual(code, 0, err)
        container = self.fake.called("POST", "42/media")[0]
        self.assertEqual(container["media_type"], "REELS")
        self.assertEqual(container["video_url"], "https://example.com/reel.mp4")
        self.assertIn("#один", container["caption"])
        self.assertGreaterEqual(len(self.fake.called("GET", "c1")), 3)  # ждали обработку
        self.assertEqual(len(self.fake.called("POST", "42/media_publish")), 1)
        self.assertIn("✓ Опубликовано. ID: 555", out)
        self.assertIn("https://www.instagram.com/reel/TEST/", out)

    def test_publish_log_updates_queue_state(self) -> None:
        _, out, _ = self.publish("--yes", "--video-url", "https://example.com/reel.mp4")
        log = self.dir / "publish.log"
        log.write_text(out, encoding="utf-8")
        state = self.dir / "next.json"
        state.write_text(json.dumps({"id": "x", "status": "pending"}), encoding="utf-8")
        with contextlib.redirect_stdout(io.StringIO()):
            ci_state.posted(log, state)
        saved = json.loads(state.read_text(encoding="utf-8"))
        self.assertEqual(saved["status"], "posted")
        self.assertEqual(saved["mediaId"], "555")
        self.assertEqual(saved["permalink"], "https://www.instagram.com/reel/TEST/")

    def test_needs_confirmation_without_yes(self) -> None:
        with mock.patch("sys.stdin.isatty", return_value=False):
            code, _, err = self.publish()
        self.assertEqual(code, 1)
        self.assertIn("--yes", err)
        self.assertEqual(self.fake.called("POST", "42/media"), [])

    def test_too_many_hashtags_rejected(self) -> None:
        self.caption.write_text(" ".join(f"#t{i}" for i in range(31)), encoding="utf-8")
        code, _, err = self.publish("--dry-run")
        self.assertEqual(code, 1)
        self.assertIn("Хештегов 31", err)

    def test_missing_video_rejected(self) -> None:
        self.video.unlink()
        code, _, err = self.publish("--dry-run")
        self.assertEqual(code, 1)
        self.assertIn("Файл не найден", err)


class ErrorHandlingTests(unittest.TestCase):
    def test_auth_error_has_hint_and_hides_token(self) -> None:
        fake = FakeGraph(auth_error=True)
        self.addCleanup(fake.close)
        code, out, err = run_cli(fake.base, "check")
        self.assertEqual(code, 1)
        self.assertIn("Токен недействителен", err)
        self.assertNotIn(TOKEN, out + err)

    def test_no_network_error_hides_token(self) -> None:
        code, out, err = run_cli("http://127.0.0.1:9/v23.0", "check")
        self.assertEqual(code, 1)
        self.assertIn("Нет связи с Instagram API", err)
        self.assertNotIn(TOKEN, out + err)


class VideoServerTests(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.data = bytes(range(256)) * 8
        video = Path(tmp.name) / "my reel.mp4"
        video.write_bytes(self.data)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), ig.make_handler(video))
        self.server.daemon_threads = True
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.url = f"http://127.0.0.1:{self.server.server_address[1]}/my%20reel.mp4"
        self.http = requests.Session()
        self.http.trust_env = False

    def test_full_file(self) -> None:
        response = self.http.get(self.url)
        self.assertEqual((response.status_code, response.content), (200, self.data))

    def test_range_requests(self) -> None:
        part = self.http.get(self.url, headers={"Range": "bytes=2-5"})
        self.assertEqual((part.status_code, part.content), (206, self.data[2:6]))
        self.assertEqual(part.headers["Content-Range"], f"bytes 2-5/{len(self.data)}")
        tail = self.http.get(self.url, headers={"Range": "bytes=-4"})
        self.assertEqual(tail.content, self.data[-4:])
        rest = self.http.get(self.url, headers={"Range": "bytes=2040-"})
        self.assertEqual(rest.content, self.data[2040:])
        self.assertEqual(self.http.get(self.url, headers={"Range": "bytes=99999-"}).status_code, 416)

    def test_head_has_length_and_no_body(self) -> None:
        response = self.http.head(self.url)
        self.assertEqual(int(response.headers["Content-Length"]), len(self.data))
        self.assertEqual(response.content, b"")


class QueueStateTests(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.state = self.dir / "next.json"

    def plan(self, status: str, event: str, dry_run: str) -> tuple[bool, bool]:
        self.state.write_text(json.dumps({"status": status}), encoding="utf-8")
        with contextlib.redirect_stdout(io.StringIO()):
            return ci_state.plan(event, dry_run, self.state)

    def test_pending_runs_on_schedule(self) -> None:
        self.assertEqual(self.plan("pending", "schedule", ""), (True, True))

    def test_posted_is_never_published_again(self) -> None:
        self.assertEqual(self.plan("posted", "schedule", ""), (False, False))
        self.assertEqual(self.plan("posted", "workflow_dispatch", "false"), (False, False))

    def test_dry_run_renders_but_never_publishes(self) -> None:
        self.assertEqual(self.plan("posted", "workflow_dispatch", "true"), (True, False))
        self.assertEqual(self.plan("pending", "workflow_dispatch", "true"), (True, False))

    def test_posted_rejects_log_without_success_marker(self) -> None:
        self.state.write_text(json.dumps({"status": "pending"}), encoding="utf-8")
        log = self.dir / "bad.log"
        log.write_text("ошибка", encoding="utf-8")
        with self.assertRaises(SystemExit):
            ci_state.posted(log, self.state)
        self.assertEqual(json.loads(self.state.read_text(encoding="utf-8"))["status"], "pending")

    def test_verify_video(self) -> None:
        small, good = self.dir / "small.mp4", self.dir / "good.mp4"
        small.write_bytes(b"x" * 100)
        good.write_bytes(b"\x00\x00\x00\x18ftypmp42" + b"0" * (600 * 1024))
        with self.assertRaises(SystemExit):
            ci_state.verify(small)
        with contextlib.redirect_stdout(io.StringIO()):
            ci_state.verify(good)


class RefreshTests(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.no_env = Path(tmp.name) / "missing.env"  # настоящий .env тестами не трогаем

    def refresh(self, fake: FakeGraph) -> tuple[int, str, str]:
        self.addCleanup(fake.close)
        with mock.patch.object(ig, "ENV_PATH", self.no_env), \
                mock.patch.object(ig, "REFRESH_URL", fake.root + "/refresh_access_token"):
            return run_cli(fake.base, "refresh")

    def test_same_token_is_extended(self) -> None:
        code, out, err = self.refresh(FakeGraph())
        self.assertEqual(code, 0)
        self.assertIn("не изменилось", out)
        self.assertNotIn(TOKEN, out + err)

    def test_new_token_without_env_fails_and_is_never_printed(self) -> None:
        code, out, err = self.refresh(FakeGraph(refresh_token="NEW-TOKEN-999"))
        self.assertNotEqual(code, 0)
        self.assertNotIn("NEW-TOKEN-999", out + err)
        self.assertNotIn(TOKEN, out + err)


class EpisodeTests(unittest.TestCase):
    def test_defaults(self) -> None:
        self.assertEqual(ci_state.episode({"status": "pending"}), ("Password", "content/caption.txt", ""))

    def test_custom_episode(self) -> None:
        state = {"composition": "Ep02-Phishing", "caption": "content/episodes/ep02/caption.txt"}
        self.assertEqual(ci_state.episode(state), ("Ep02-Phishing", "content/episodes/ep02/caption.txt", ""))

    def test_prerendered_video(self) -> None:
        state = {"video": "content/videos/pentest.mp4", "caption": "content/captions/pentest.txt"}
        self.assertEqual(ci_state.episode(state),
                         ("Password", "content/captions/pentest.txt", "content/videos/pentest.mp4"))

    def test_rejects_unsafe_values(self) -> None:
        bad_states = [
            {"composition": "Password; rm -rf /"},
            {"composition": "$(id)"},
            {"caption": "../secret.txt"},
            {"caption": "/etc/passwd"},
            {"caption": "content/a.txt; id"},
            {"caption": "content/../x.txt"},
            {"video": "../x.mp4"},
            {"video": "/tmp/x.mp4"},
            {"video": "content/a.mov"},
            {"video": "content/a.mp4; id"},
        ]
        for bad in bad_states:
            with self.subTest(bad=bad), self.assertRaises(SystemExit):
                ci_state.episode(bad)

    def test_plan_exposes_episode_to_workflow(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "next.json"
            output = Path(tmp) / "github_output"
            state.write_text(json.dumps({"status": "pending", "composition": "Ep02",
                                         "caption": "content/ep02.txt",
                                         "video": "content/videos/ep02.mp4"}), encoding="utf-8")
            with mock.patch.dict(os.environ, {"GITHUB_OUTPUT": str(output)}), \
                    contextlib.redirect_stdout(io.StringIO()):
                ci_state.plan("schedule", "", state)
            lines = output.read_text(encoding="utf-8").splitlines()
        self.assertIn("composition=Ep02", lines)
        self.assertIn("caption=content/ep02.txt", lines)
        self.assertIn("video=content/videos/ep02.mp4", lines)
        self.assertIn("publish=true", lines)


if __name__ == "__main__":
    unittest.main()

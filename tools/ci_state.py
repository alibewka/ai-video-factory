#!/usr/bin/env python3
"""Помощник для GitHub Actions: решает, что запускать, проверяет видео и отмечает ролик опубликованным.

    python tools/ci_state.py plan <event> <dry_run>   # пишет run/publish/composition/caption в GITHUB_OUTPUT
    python tools/ci_state.py verify <video.mp4>       # проверяет, что файл похож на нормальное видео
    python tools/ci_state.py posted <publish.log>     # ставит status=posted в content/next.json
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

STATE = Path("content/next.json")
MIN_VIDEO_BYTES = 500 * 1024
DEFAULT_COMPOSITION = "Password"
DEFAULT_CAPTION = "content/caption.txt"
SAFE_COMPOSITION = re.compile(r"^[A-Za-z0-9_-]+$")
SAFE_CAPTION = re.compile(r"^content/[A-Za-z0-9_./-]+\.txt$")
SAFE_VIDEO = re.compile(r"^content/[A-Za-z0-9_./-]+\.mp4$")


def emit(key: str, value: object) -> None:
    text = str(value).lower() if isinstance(value, bool) else str(value)
    target = os.environ.get("GITHUB_OUTPUT")
    if target:
        with open(target, "a", encoding="utf-8") as handle:
            handle.write(f"{key}={text}\n")
    print(f"{key}={text}")


def read_state(path: Path = STATE) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def episode(state: dict) -> tuple[str, str, str]:
    """Какую композицию Remotion рендерить, откуда брать описание и есть ли готовое видео.

    Если задано поле video, Remotion не запускается: публикуется готовый mp4 из репозитория.

    Значения попадают в команды workflow, поэтому проверяются строго.
    """
    composition = state.get("composition", DEFAULT_COMPOSITION)
    caption = state.get("caption", DEFAULT_CAPTION)
    video = state.get("video", "")
    if not isinstance(composition, str) or not SAFE_COMPOSITION.match(composition):
        sys.exit(f"content/next.json: недопустимое имя композиции: {composition!r}")
    if not isinstance(caption, str) or not SAFE_CAPTION.match(caption) or ".." in caption:
        sys.exit(f"content/next.json: описание должно лежать в content/ и быть файлом .txt: {caption!r}")
    if not isinstance(video, str) or (video and (not SAFE_VIDEO.match(video) or ".." in video)):
        sys.exit(f"content/next.json: готовое видео должно лежать в content/ и быть файлом .mp4: {video!r}")
    return composition, caption, video


def plan(event: str, dry_run: str, state_path: Path = STATE) -> tuple[bool, bool]:
    state = read_state(state_path)
    pending = state.get("status") == "pending"
    if event == "workflow_dispatch" and dry_run == "true":
        run, publish = True, False  # тестовая сборка без публикации
    else:
        run, publish = pending, pending
    if not run:
        print(f"::notice::В очереди нет ролика со статусом pending (сейчас: {state.get('status')}). Ничего не делаю.")
    composition, caption, video = episode(state) if run else (DEFAULT_COMPOSITION, DEFAULT_CAPTION, "")
    emit("run", run)
    emit("publish", publish)
    emit("composition", composition)
    emit("caption", caption)
    emit("video", video)
    return run, publish


def verify(video: Path) -> None:
    data = video.read_bytes()
    if len(data) < MIN_VIDEO_BYTES:
        sys.exit(f"Видео подозрительно маленькое: {len(data)} байт")
    if data[4:8] != b"ftyp":
        sys.exit("Файл не похож на mp4 (нет заголовка ftyp)")
    print(f"✓ Видео выглядит нормально: {len(data) / 1024 / 1024:.1f} МБ")


def posted(log_path: Path, state_path: Path = STATE) -> None:
    log = log_path.read_text(encoding="utf-8", errors="replace")
    if "✓ Опубликовано" not in log:
        sys.exit("В журнале нет отметки об успешной публикации")
    state = read_state(state_path)
    link = re.search(r"https://www\.instagram\.com/\S+", log)
    media = re.search(r"Опубликовано\. ID: (\d+)", log)
    state.update(
        status="posted",
        permalink=link.group(0) if link else "",
        mediaId=media.group(1) if media else "",
        postedAt=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("✓ content/next.json: status=posted")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    p_plan = sub.add_parser("plan")
    p_plan.add_argument("event")
    p_plan.add_argument("dry_run")
    sub.add_parser("verify").add_argument("video", type=Path)
    sub.add_parser("posted").add_argument("log", type=Path)
    args = parser.parse_args(argv)
    if args.command == "plan":
        plan(args.event, args.dry_run)
    elif args.command == "verify":
        verify(args.video)
    else:
        posted(args.log)
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Публикация Reels в Instagram. Токен читается из .env рядом со скриптом и нигде не печатается.
Запуск:  python3 publish_reel.py            (проверка аккаунта + публикация после подтверждения)
         python3 publish_reel.py --check    (только проверить токен и аккаунт)
"""
import json, os, sys, time, urllib.request, urllib.parse, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO = os.path.join(HERE, "wifi-explainer-v3.mp4")
CAPTION_FILE = os.path.join(HERE, "caption.txt")
VER = "v21.0"


def load_env():
    env = {}
    with open(os.path.join(HERE, ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def call(method, url, data=None, headers=None, body=None):
    headers = dict(headers or {})
    if data is not None:
        body = urllib.parse.urlencode(data).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except Exception:
            err = {"error": {"message": f"HTTP {e.code}"}}
        return err


def die(msg):
    print("ОШИБКА:", msg)
    sys.exit(1)


def main():
    env = load_env()
    uid, token = env.get("IG_USER_ID", ""), env.get("IG_ACCESS_TOKEN", "")
    if not uid or not token or "вставь" in uid or "вставь" in token:
        die("в .env не заполнены IG_USER_ID / IG_ACCESS_TOKEN")
    auth = {"Authorization": "Bearer " + token}

    host = None
    for h in ("graph.facebook.com", "graph.instagram.com"):
        r = call("GET", f"https://{h}/{VER}/{uid}?fields=username", headers=auth)
        if "username" in r:
            host, name = h, r["username"]
            break
        last = r
    if not host:
        die("токен/ID не подошли: " + str(last.get("error", {}).get("message", last)))
    print(f"Аккаунт найден: @{name}  (сервер {host})")
    if "--check" in sys.argv:
        print("Проверка пройдена.")
        return

    if not os.path.exists(VIDEO):
        die("не найден файл " + VIDEO)
    caption = open(CAPTION_FILE, encoding="utf-8").read().strip()
    size = os.path.getsize(VIDEO)
    print(f"\nВидео: {os.path.basename(VIDEO)} ({size/1e6:.1f} МБ)\nОписание:\n---\n{caption}\n---")
    if input(f"Опубликовать Reels в @{name}? (да/нет): ").strip().lower() not in ("да", "y", "yes", "д"):
        print("Отменено."); return

    r = call("POST", f"https://{host}/{VER}/{uid}/media",
             data={"media_type": "REELS", "upload_type": "resumable", "caption": caption,
                   "share_to_feed": "true"}, headers=auth)
    cid = r.get("id")
    if not cid:
        die("не создан контейнер: " + str(r.get("error", {}).get("message", r)))
    print("Контейнер создан. Загружаю видео...")

    with open(VIDEO, "rb") as f:
        payload = f.read()
    r = call("POST", f"https://rupload.facebook.com/ig-api-upload/{VER}/{cid}",
             headers={"Authorization": "OAuth " + token, "offset": "0", "file_size": str(size)},
             body=payload)
    if not r.get("success", False) and "error" in r:
        die("загрузка не удалась: " + str(r["error"].get("message", r)))
    print("Видео загружено. Жду обработку Instagram...")

    for i in range(60):
        r = call("GET", f"https://{host}/{VER}/{cid}?fields=status_code,status", headers=auth)
        st = r.get("status_code")
        print(f"  статус: {st}")
        if st == "FINISHED":
            break
        if st in ("ERROR", "EXPIRED"):
            die("Instagram отклонил видео: " + str(r.get("status", r)))
        time.sleep(5)
    else:
        die("обработка заняла слишком долго; попробуй ещё раз позже")

    r = call("POST", f"https://{host}/{VER}/{uid}/media_publish", data={"creation_id": cid}, headers=auth)
    mid = r.get("id")
    if not mid:
        die("публикация не удалась: " + str(r.get("error", {}).get("message", r)))
    link = call("GET", f"https://{host}/{VER}/{mid}?fields=permalink", headers=auth).get("permalink", "")
    print("\nГОТОВО! Reels опубликован.", link)


if __name__ == "__main__":
    main()

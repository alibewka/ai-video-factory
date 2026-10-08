#!/bin/bash
# Двойной клик: ставит фонового помощника, который публикует ролики по команде из чата.
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
LABEL="com.allibekwx.igpublisher"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
pause() { echo; read -n1 -s -r -p "Нажми любую клавишу, чтобы закрыть окно…"; echo; }

echo "== Установка помощника публикации =="
NODE="$(/bin/zsh -lic 'command -v node' 2>/dev/null | tail -n1)"
if [ -z "$NODE" ] || [ ! -x "$NODE" ]; then NODE="$(command -v node)"; fi
if [ -z "$NODE" ] || [ ! -x "$NODE" ]; then
  echo "✗ Не нашёл Node.js. Установи его с nodejs.org и запусти этот файл снова."; pause; exit 1
fi
NODEDIR="$(dirname "$NODE")"
echo "Node.js: $NODE ($("$NODE" -v))"

if [ ! -d "$ROOT/node_modules" ]; then
  echo "Ставлю зависимости проекта (один раз, может занять пару минут)…"
  PATH="$NODEDIR:$PATH" "$NODEDIR/npm" install --no-audit --no-fund || { echo "✗ npm install не удался"; pause; exit 1; }
fi

mkdir -p "$ROOT/queue/done" "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$NODE</string><string>$ROOT/tools/publisher-daemon.mjs</string></array>
  <key>WorkingDirectory</key><string>$ROOT</string>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>$NODEDIR:$HOME/homebrew/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$ROOT/queue/daemon.log</string>
  <key>StandardErrorPath</key><string>$ROOT/queue/daemon.log</string>
</dict>
</plist>
PLISTEOF

launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null
launchctl bootstrap "gui/$(id -u)" "$PLIST" || { echo "✗ Не удалось запустить помощника"; pause; exit 1; }
launchctl kickstart -k "gui/$(id -u)/$LABEL" 2>/dev/null

echo
echo "✓ Готово. Помощник работает в фоне и запускается сам при входе в систему."
echo "  Вернись в чат с Claude и напиши «установил»."
pause

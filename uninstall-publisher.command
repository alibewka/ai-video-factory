#!/bin/bash
# Двойной клик: выключает и удаляет фонового помощника публикации.
LABEL="com.allibekwx.igpublisher"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
launchctl bootout "gui/$(id -u)" "$PLIST" 2>/dev/null
mv "$PLIST" "$HOME/.Trash/$LABEL.plist" 2>/dev/null
echo "✓ Помощник выключен."
read -n1 -s -r -p "Нажми любую клавишу…"; echo

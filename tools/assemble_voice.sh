#!/bin/bash
# Склейка озвучки: public/vo/l1..l9.mp3 (ElevenLabs) -> public/voice.mp3 (ускорение 1.08, тайминги из timeline.ts)
set -e
cd "$(dirname "$0")/.."
python3 - <<'PY'
import subprocess
starts=[0.1,5.67,9.48,13.63,21.78,28.39,30.65,39.84,46.58]
cmd=["ffmpeg","-y","-v","error"]
for i in range(1,10): cmd+=["-i",f"public/vo/l{i}.mp3"]
fl=[]
for i,t in enumerate(starts):
    ms=int(t*1000)
    fl.append(f"[{i}:a]atempo=1.08,aresample=44100,adelay={ms}|{ms}[a{i}]")
fl.append("".join(f"[a{i}]" for i in range(9))+"amix=inputs=9:normalize=0,alimiter=limit=0.95[o]")
cmd+=["-filter_complex",";".join(fl),"-map","[o]","-t","52","-ac","1","public/voice.mp3"]
subprocess.run(cmd,check=True)
PY
echo done

import json, sys, numpy as np
sys.path.insert(0, "tools")
import make_sfx as m
T = json.load(open("src/voiceTiming.json"))
SE = T["sents"]
m.EVENTS.clear()
def sent(i, k): return SE[i][k]["from"]
def tw(i, needle, off=0.0):
    # слово по предложениям, пропорционально длине
    for se in SE[i]:
        ws = se["t"].split()
        wt = [len("".join(ch for ch in w if ch.isalnum())) + 1.5 for w in ws]
        for k, w in enumerate(ws):
            if w.lower().lstrip('«"(').startswith(needle.lower()):
                return se["from"] + (se["to"] - se["from"]) * sum(wt[:k]) / sum(wt) + off
    print("not found", i, needle); return T["starts"][i]
def start(i): return 0 if i == 0 else max(0, T["starts"][i] - 0.06)
ev = m.ev
# хук
ev(0.0, "boom", 0.8); ev(0.04, "notif" if "notif" in m.SYNTH else "pop", 0.7)
ev(sent(0,2), "ding", 0.8); ev(sent(0,2)+0.05, "blip", 0.7, freq=500)
ev(sent(0,3), "glitch", 0.7); ev(sent(0,3), "thud", 0.8)
ev(sent(0,4), "pop", 0.7)
ev(sent(0,5), "alarm", 0.4); ev(sent(0,5)+0.1, "thud", 0.8)
for i in range(1, 8): ev(start(i)-0.15, "whoosh", 0.55)
# почему
ev(sent(1,1), "pop", 0.7); ev(tw(1,"проверить"), "blip", 0.7, freq=420); ev(sent(1,3), "ding", 0.6)
# приём
ev(sent(2,0), "pop", 0.7); ev(sent(2,1), "pop", 0.7); ev(tw(2,"выбирает"), "thud", 0.9); ev(tw(2,"выбирает")+0.02, "alarm", 0.4)
ev(sent(2,3), "ding", 0.6)
# ловушка
ev(sent(3,0)+0.1, "pop", 0.8)
ev(tw(3,"выглядит"), "sparkle", 0.6)
t = tw(3,"вводишь")
for k in range(9): ev(t+0.12+k*0.07, "tick", 0.5)
t = tw(3,"чужого"); ev(t, "alarm", 0.6); ev(t, "thud", 0.9); ev(t+0.05, "glitch", 0.6)
ev(sent(3,3), "ding", 0.6)
# замочек
ev(sent(4,0)+0.1, "check", 0.8); ev(sent(4,1)+0.1, "thud", 0.8); ev(sent(4,1)+0.15, "alarm", 0.4)
ev(sent(4,2), "ding", 0.6); ev(sent(4,3), "ding", 0.6)
# дело
ev(sent(5,0)+0.1, "pop", 0.8); ev(sent(5,1)+0.1, "pop", 0.8)
for n in ("Перта", "Мельбурна", "Аделаиды"): ev(tw(5,n), "pop", 0.8); ev(tw(5,n)+0.05, "blip", 0.6, freq=550)
t = sent(5,3); ev(t, "boom", 0.9); ev(t+0.02, "thud", 1.0); ev(t+0.05, "glitch", 0.5)
# защита
for k in (1, 2, 4, 5):
    t = sent(6,k); ev(t+0.05, "pop", 0.8); ev(t+0.3, "check", 0.8)
ev(sent(6,3), "ding", 0.5)
# итог
ev(sent(7,0)+0.1, "pop", 0.8); ev(sent(7,1)+0.1, "pop", 0.8)
t = tw(7,"подписывайся"); ev(t-0.3, "whoosh", 0.6); ev(t, "ding", 0.9); ev(t+0.2, "sparkle", 0.7)
ev(T["total"]-1.2, "thud", 0.8); ev(T["total"]-1.2, "pop", 0.7)
m.LENGTH = T["total"] + 0.5
m.main()

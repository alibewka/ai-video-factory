import json, sys, numpy as np
sys.path.insert(0, "tools")
import make_sfx as m

T = json.load(open("src/voiceTiming.json"))
TX = json.load(open("src/lines.json"))
m.EVENTS.clear()
m.LENGTH = 60.0

def tw(i, needle, off=0.0):
    ws = TX[i].split()
    wt = [len("".join(ch for ch in w if ch.isalnum())) + 1.5 for w in ws]
    n = needle.lower()
    idx = 0
    for k, w in enumerate(ws):
        if w.lower().lstrip('«"(').startswith(n):
            idx = k; break
    a, b = T["starts"][i], T["ends"][i]
    return a + (b - a) * sum(wt[:idx]) / sum(wt) + off

def start(i): return 0 if i == 0 else max(0, T["starts"][i] - 0.06)

def notif():
    t = m.T(0.5)
    return (np.sin(2*np.pi*1568*t)*np.exp(-t*9) + np.sin(2*np.pi*2093*np.maximum(t-0.12,0))*(t>0.12)*np.exp(-(t-0.12)*9)) * 0.5
m.SYNTH["notif"] = lambda **kw: notif()

ev = m.ev
# сцена 0: хук
ev(0.0, "boom", 0.8); ev(0.05, "notif", 0.8)
t = tw(0, "Иначе", -0.1); ev(t-0.05, "alarm", 0.8); ev(t, "glitch", 0.8); ev(t, "boom", 0.9); ev(t+0.05, "thud", 0.8)
ev(tw(0, "чужих", -0.2), "blip", 0.8, freq=500)
for i in range(1, 11): ev(start(i)-0.15, "whoosh", 0.55)
# сцена 1: тизер
for d in [6, 18, 30]: ev(start(1)+d/30, "pop", 0.6)
ev(tw(1, "четвёртую", -0.1), "blip", 0.8, freq=500)
# сцена 2: почему
ev(tw(2, "хранятся", -0.1), "pop", 0.7); ev(tw(2, "читать", -0.2), "blip", 0.7, freq=600); ev(tw(2, "учат", -0.4), "sparkle", 0.6)
# сцены 3-6: запреты
for i, keys in [(3, ["пароли", "коды", "проверить"]), (4, ["паспорт", "карты", "адрес"]), (5, ["документы", "переписки", "клиентов"]), (6, ["Здоровье", "отношения", "долги"])]:
    ev(start(i)+0.1, "thud", 0.7)
    for k in keys:
        t = tw(i, k); ev(t, "pop", 0.8); ev(t+0.4, "tick", 0.7)
ev(tw(3, "Любые"), "thud", 1.0); ev(tw(3, "Любые"), "glitch", 0.5)
ev(tw(4, "мошенник"), "alarm", 0.5); ev(tw(4, "мошенник"), "thud", 0.8)
ev(tw(6, "самое"), "pop", 0.8); ev(tw(6, "самое"), "thud", 0.6)
ev(tw(6, "первому"), "blip", 0.7, freq=450)
# сцена 7: опрос
for d in [4, 8, 12, 16]: ev(start(7)+d/30, "pop", 0.6)
ev(tw(7, "Что"), "ding", 0.7); ev(tw(7, "Напиши", -0.1), "ding", 0.9); ev(tw(7, "Напиши", -0.1)+0.15, "sparkle", 0.6)
# сцена 8: защита 1
ev(start(8)+0.1, "sparkle", 0.6)
ev(tw(8, "Иван"), "pop", 0.8); ev(tw(8, "Клиент", -0.1)-0.35, "tick", 0.8); ev(tw(8, "Клиент", -0.1)-0.3, "thud", 0.6)
ev(tw(8, "Клиент", -0.1), "pop", 0.9); ev(tw(8, "Клиент", -0.1)+0.2, "check", 0.9); ev(tw(8, "Клиент", -0.1)+0.25, "sparkle", 0.6)
# сцена 9: защита 2
ev(start(9)+0.1, "sparkle", 0.6)
t = tw(9, "выключи", 0.25); ev(t, "tick", 0.9); ev(t+0.1, "ding", 0.7)
ev(tw(9, "временном", -0.3), "pop", 0.9); ev(tw(9, "временном", -0.3)+0.2, "check", 0.8)
# сцена 10: CTA
ev(tw(10, "Сохрани"), "pop", 0.9); ev(tw(10, "отправь"), "pop", 0.9)
ev(tw(10, "подпишись")-0.3, "whoosh", 0.6); ev(tw(10, "подпишись"), "ding", 0.9); ev(tw(10, "подпишись")+0.2, "sparkle", 0.7)
ev(T["total"]-1.1, "thud", 0.9); ev(T["total"]-1.1, "pop", 0.8)
m.LENGTH = T["total"] + 0.5
m.main()

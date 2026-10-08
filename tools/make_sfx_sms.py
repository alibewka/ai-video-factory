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
ev(0.0, "boom", 0.9); ev(0.45, "notif", 0.9)
t = tw(0, "уже"); ev(t-0.05, "alarm", 0.8); ev(t, "glitch", 0.8); ev(t, "boom", 0.9); ev(t+0.05, "thud", 0.8)
# whoosh на каждом переходе
for i in range(1, 11): ev(start(i)-0.15, "whoosh", 0.55)
# сцена 1: тизер
for k, d in enumerate([8, 26, 44]): ev(start(1)+d/30, "pop", 0.6)
ev(tw(1, "защита", -0.1), "blip", 0.8, freq=500)
# сцена 2: ввод номера
a, b = tw(2, "вводит"), tw(2, "чтобы")
n = 16
for k in range(n): ev(a + (b-a)*k/n, "key", 0.5)
ev(tw(2, "войти"), "enter", 0.8); ev(tw(2, "войти")+0.15, "blip", 0.6, freq=1200)
# сцена 3: код
ev(start(3)+8/30, "notif", 0.9)
ev(tw(3, "настоящий"), "pop", 0.8); ev(tw(3, "От"), "ding", 0.7)
# сцена 4: сообщение
ev(tw(4, "Привет!", -0.05), "pop", 0.8)
a, b = tw(4, "пожалуйста"), T["ends"][4]
for k in range(5): ev(a + 0.09*k, "key", 0.5)
ev(tw(4, "Скинь"), "blip", 0.7, freq=700)
ev(tw(4, "пожалуйста"), "riser", 0.5, d=max(0.5, T["ends"][4]-tw(4, "пожалуйста")))
# сцена 5: взлом
t = tw(5, "Всё"); ev(t, "boom", 0.9); ev(t, "glitch", 0.8); ev(t+0.05, "thud", 0.8)
for k in range(3): ev(t+0.2+0.2*k, "blip", 0.5, freq=700+100*k)
t = tw(5, "напишет")
for k in range(4): ev(t+k*8/30, "blip", 0.7, freq=800+90*k)
ev(tw(5, "Срочно"), "thud", 0.9); ev(tw(5, "Срочно"), "alarm", 0.5)
# сцена 6: легенды
for key in ["Раз:", "Два:", "Три:"]:
    ev(tw(6, key, -0.05), "pop", 0.9); ev(tw(6, key, -0.05), "thud", 0.4)
ev(tw(6, "Какой"), "ding", 0.8); ev(tw(6, "Напиши"), "ding", 0.9); ev(tw(6, "Напиши")+0.15, "sparkle", 0.6)
# сцена 7: правило 1
ev(start(7)+6/30, "sparkle", 0.8); ev(start(7)+14/30, "ding", 0.6)
ev(tw(7, "код"), "thud", 1.0); ev(tw(7, "код"), "pop", 0.7)
for k in range(3): ev(tw(7, "Даже")+k*7/30+8/30, "pop", 0.7)
# сцена 8: правило 2
t = tw(8, "облачный", 0.25); ev(t, "tick", 0.9); ev(t+0.1, "ding", 0.7)
ev(tw(8, "Тогда"), "check", 0.8)
t = tw(8, "мало"); ev(t, "thud", 1.0); ev(t, "glitch", 0.6); ev(t, "alarm", 0.5)
# сцена 9: правило 3
for d in [10, 20, 28]: ev(start(9)+d/30, "pop", 0.5)
t = tw(9, "заверши", 0.1); ev(t, "tick", 0.9)
ev(t+0.25, "whoosh", 0.5); ev(t+0.5, "check", 0.9); ev(t+0.55, "sparkle", 0.6)
# сцена 10: CTA
ev(tw(10, "Сохрани"), "pop", 0.9); ev(tw(10, "отправь"), "pop", 0.9)
ev(tw(10, "подпишись")-0.3, "whoosh", 0.6); ev(tw(10, "подпишись"), "ding", 0.9); ev(tw(10, "подпишись")+0.2, "sparkle", 0.7)
ev(T["total"]-1.1, "thud", 0.9); ev(T["total"]-1.1, "pop", 0.8)
m.main()

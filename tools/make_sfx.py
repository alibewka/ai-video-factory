"""Синтез звуковых эффектов и сведение в public/sfx.wav.
Запуск: python3 tools/make_sfx.py   (нужны numpy и scipy)
Тайминги событий (секунды от начала ролика) — в списке EVENTS внизу."""
import wave
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
LENGTH = 52.0
rng = np.random.default_rng(3)


def T(d):
    return np.arange(int(SR * d)) / SR


def hp(x, fc):
    b, a = butter(2, fc / (SR / 2), "high")
    return lfilter(b, a, x)


def lp(x, fc):
    b, a = butter(2, fc / (SR / 2), "low")
    return lfilter(b, a, x)


def sweep_noise(d, f0, f1):
    """Шум, пропущенный через двойной ФНЧ с плывущей частотой среза (полоса)."""
    n = int(SR * d)
    x = rng.standard_normal(n)
    cutoff = np.geomspace(f0, f1, n)
    a = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y1 = y2 = 0.0
    out = np.empty(n)
    for i in range(n):
        y1 += a[i] * (x[i] - y1)
        y2 += a[i] * (y1 - y2)
        out[i] = y1 - y2
    return out / (np.max(np.abs(out)) + 1e-9)


def key(vol=1.0):
    t = T(0.09)
    n = rng.standard_normal(len(t))
    click = hp(n, 2500) * np.exp(-t * 160) * 0.7
    body = np.sin(2 * np.pi * rng.uniform(900, 1500) * t) * np.exp(-t * 140) * 0.45
    thump = np.sin(2 * np.pi * 170 * t) * np.exp(-t * 80) * 0.35
    return (click + body + thump) * vol


def enter():
    k = key(1.0)
    t = T(0.16)
    out = np.zeros(len(t))
    out[: len(k)] += k
    return out + np.sin(2 * np.pi * 110 * t) * np.exp(-t * 40) * 0.5


def tick(freq=1800):
    t = T(0.035)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 200) * 0.6 + hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 300) * 0.2


def pop(f0=720, f1=260, d=0.13):
    t = T(d)
    ph = 2 * np.pi * np.cumsum(np.linspace(f0, f1, len(t))) / SR
    return np.sin(ph) * np.exp(-t * 28) * 0.8


def blip(freq=900):
    t = T(0.08)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 50) * 0.5


def whoosh(d=0.5):
    x = sweep_noise(d, 350, 4200)
    t = T(d)
    env = np.sin(np.pi * t / d) ** 2
    return x * env * 0.9


def riser(d):
    x = sweep_noise(d, 250, 5000)
    t = T(d)
    ramp = (t / d) ** 2
    sine = np.sin(2 * np.pi * np.cumsum(np.geomspace(220, 1900, len(t))) / SR) * 0.35
    return (x * 0.8 + sine) * ramp


def boom():
    t = T(0.8)
    ph = 2 * np.pi * np.cumsum(np.geomspace(130, 34, len(t))) / SR
    body = np.sin(ph) * np.exp(-t * 5)
    air = lp(rng.standard_normal(len(t)), 220) * np.exp(-t * 22) * 2.0
    return (body + air) * 0.95


def thud():
    t = T(0.3)
    ph = 2 * np.pi * np.cumsum(np.geomspace(150, 55, len(t))) / SR
    return (np.sin(ph) * np.exp(-t * 18) + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 70) * 0.8) * 0.95


def alarm():
    out = np.zeros(int(SR * 0.5))
    for i, f in enumerate([880, 660, 880, 660]):
        t = T(0.11)
        sq = np.sign(np.sin(2 * np.pi * f * t)) * 0.4
        sq = lp(sq, 3000) * np.minimum(1, (0.11 - t) * 60)
        s0 = int(i * 0.11 * SR)
        out[s0 : s0 + len(t)] += sq
    return out * 0.7


def glitch(d=0.28):
    n = int(SR * d)
    out = np.zeros(n)
    pos = 0
    while pos < n:
        seg = int(SR * rng.uniform(0.012, 0.045))
        if rng.random() < 0.7:
            x = rng.standard_normal(seg)
            hold = rng.integers(3, 14)
            x = np.repeat(x[::hold], hold)[:seg]
            x = np.round(x * 3) / 3
            out[pos : pos + seg] = x[: n - pos] * 0.5
        pos += seg
    return out


def ding(f=1318, d=0.9):
    t = T(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * np.exp(-t * 5) * 0.5


def sparkle():
    out = np.zeros(int(SR * 0.7))
    for i, f in enumerate([1046, 1318, 1568, 2093]):
        t = T(0.4)
        s0 = int(i * 0.06 * SR)
        out[s0 : s0 + len(t)] += np.sin(2 * np.pi * f * t) * np.exp(-t * 9) * 0.45
    return out


def whirr(d):
    t = T(d)
    x = lp(rng.standard_normal(len(t)), 900)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 34 * t)
    ramp = np.minimum(1, t / 0.8) * np.minimum(1, (d - t) / 0.4)
    return x * am * ramp * 1.2


def check_tick():
    a = pop(900, 1400, 0.09) * 0.8
    b = tick(2400) * 0.5
    out = a.copy()
    out[: len(b)] += b
    return out


# ---- события: (время, тип, параметры, громкость) ----
EVENTS = []


def ev(t, kind, gain=1.0, **kw):
    EVENTS.append((t, kind, gain, kw))


# Хук (0–5.6)
ev(0.0, "boom", 0.55)
for i in range(6):
    ev(0.8 + 0.2 * i, "key", 0.8)
ev(2.2, "enter", 1.0)
ev(2.2, "riser", 0.6, d=0.66)
ev(2.87, "alarm", 0.55)
ev(2.87, "glitch", 0.5)
ev(2.87, "boom", 1.0)
ev(2.87, "thud", 0.6)
ev(2.95, "pop", 0.8)
# переходы между сценами
for tb in (5.6, 13.4, 21.6, 30.5, 39.7, 46.4):
    ev(tb - 0.22, "whoosh", 0.55)
# Перебор (5.6–13.4)
t = 5.7
while t < 8.8:
    ev(t, "tick", 0.45, freq=1100 + 1500 * (t - 5.7) / 3.1)
    t += 0.06
t = 5.9
while t < 13.2:
    ev(t, "key", 0.28)
    t += float(rng.uniform(0.09, 0.2))
ev(9.55, "pop", 0.7)
ev(9.6, "whirr", 0.35, d=3.7)
ev(9.9, "pop", 0.8)
# Утечки (13.4–21.6)
for i in range(6):
    ev(13.67 + 0.167 * i, "blip", 0.5, freq=800 + 60 * i)
ev(16.9, "thud", 1.0)
ev(16.9, "boom", 0.35)
ev(17.0, "pop", 0.8)
# Хеш (21.6–30.5)
ev(22.0, "pop", 0.6)
ev(22.4, "pop", 0.7)
t = 23.3
while t < 24.7:
    ev(t, "tick", 0.5, freq=1600 + 800 * ((t - 23.3) / 1.4))
    t += 0.045
ev(25.9, "pop", 0.6)
for tt in (26.6, 27.2, 27.8):
    ev(tt, "blip", 0.6, freq=700)
ev(28.0, "ding", 0.9)
ev(28.5, "pop", 0.8)
# Время (30.5–39.7)
ev(31.23, "pop", 0.6)
ev(32.17, "pop", 0.7)
ev(33.5, "pop", 0.6)
ev(35.5, "pop", 0.7)
ev(36.83, "pop", 0.6)
ev(37.2, "riser", 0.7, d=1.0)
ev(38.2, "boom", 1.0)
ev(38.2, "glitch", 0.45)
ev(38.5, "pop", 0.8)
# Защита (39.7–46.4)
ev(40.9, "pop", 0.55)
ev(41.3, "check", 0.9)
ev(42.3, "pop", 0.55)
ev(42.7, "check", 0.9)
ev(43.43, "pop", 0.55)
ev(43.83, "check", 0.9)
ev(45.9, "sparkle", 0.8)
# Финал (46.4–52)
ev(46.6, "sparkle", 0.8)
ev(47.13, "pop", 0.7)
ev(47.4, "pop", 0.8)
ev(48.4, "ding", 0.8)

SYNTH = {
    "key": lambda **kw: key(),
    "enter": lambda **kw: enter(),
    "tick": lambda freq=1800, **kw: tick(freq),
    "pop": lambda **kw: pop(),
    "blip": lambda freq=900, **kw: blip(freq),
    "whoosh": lambda **kw: whoosh(),
    "riser": lambda d=1.0, **kw: riser(d),
    "boom": lambda **kw: boom(),
    "thud": lambda **kw: thud(),
    "alarm": lambda **kw: alarm(),
    "glitch": lambda **kw: glitch(),
    "ding": lambda **kw: ding(),
    "sparkle": lambda **kw: sparkle(),
    "whirr": lambda d=3.0, **kw: whirr(d),
    "check": lambda **kw: check_tick(),
}


def main():
    mix = np.zeros(int(SR * LENGTH))
    for t0, kind, gain, kw in EVENTS:
        sig = SYNTH[kind](**kw) * gain
        s0 = int(t0 * SR)
        e0 = min(len(mix), s0 + len(sig))
        mix[s0:e0] += sig[: e0 - s0]
    peak = np.max(np.abs(mix))
    mix = np.tanh(mix * 0.9)  # мягкий лимитер: удары не давят щелчки
    mix = mix / np.max(np.abs(mix)) * 0.9
    pcm = (mix * 32767).astype(np.int16)
    with wave.open("public/sfx.wav", "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"events: {len(EVENTS)}, length: {LENGTH}s, peak before norm: {peak:.2f}")


if __name__ == "__main__":
    main()

"""Склейка public/vo/l1..l10.mp3 -> public/voice.mp3 и src/voiceTiming.json
(старты/концы строк + границы предложений по паузам silencedetect)."""
import subprocess, json, re
TEMPO = 1.2
GAP = 0.08
LEAD = 0.05
TAIL = 3.0
N = 8
texts = json.load(open("src/lines.json"))
def dur(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",p]).decode())
def split_sents(t):
    return [x for x in re.split(r"(?<=[.?!])[»\"]?\s+", t.strip()) if x]
def silences(p, noise="-33dB", d="0.1"):
    out = subprocess.run(["ffmpeg","-v","info","-i",p,"-af",f"silencedetect=noise={noise}:d={d}","-f","null","-"],
                         capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    en = [(float(a), float(b)) for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", out)]
    r = list(zip(st, [e[0] for e in en], [e[1] for e in en]))
    m = []
    for a, b, d in r:
        if m and a - m[-1][1] < 0.03: m[-1] = (m[-1][0], b, b - m[-1][0])
        else: m.append((a, b, d))
    return m
raw = [dur(f"public/vo/l{i}.mp3") for i in range(1,N+1)]
ds = [d/TEMPO for d in raw]
starts=[]; t=LEAD
for d in ds:
    starts.append(round(t,3)); t+=d+GAP
total=round(t-GAP+TAIL,2)
cmd=["ffmpeg","-y","-v","error"]
for i in range(1,N+1): cmd+=["-i",f"public/vo/l{i}.mp3"]
fl=[f"[{i}:a]atempo={TEMPO},aresample=44100,adelay={int(s*1000)}|{int(s*1000)}[a{i}]" for i,s in enumerate(starts)]
fl.append("".join(f"[a{i}]" for i in range(N))+f"amix=inputs={N}:normalize=0,alimiter=limit=0.95[o]")
cmd+=["-filter_complex",";".join(fl),"-map","[o]","-t",str(total),"-ac","1","public/voice.mp3"]
subprocess.run(cmd,check=True)
ends=[round(s+d,3) for s,d in zip(starts,ds)]
sents=[]
for i in range(N):
    ss = split_sents(texts[i]); k = len(ss)
    for noise, dd_ in (("-30dB","0.05"),):
        allsil = silences(f"public/vo/l{i+1}.mp3", noise, dd_)
        _a = list(allsil)
        if _a and _a[-1][1] >= raw[i]-0.1: _a = _a[:-1]
        if _a and _a[0][0] < 0.02: _a = _a[1:]
        if len([x for x in _a if 0.15 < x[0] < raw[i]-0.15]) >= len(split_sents(texts[i]))-1: break
    sp_end = raw[i]; sp_start = 0.0
    if allsil and allsil[-1][1] >= raw[i]-0.1: sp_end = min(raw[i], allsil[-1][0]+0.06); allsil = allsil[:-1]
    if allsil and allsil[0][0] < 0.02: sp_start = max(0.0, allsil[0][1]-0.04); allsil = allsil[1:]
    sil = [x for x in allsil if sp_start+0.15 < x[0] < sp_end-0.15]
    span = sp_end - sp_start
    L = [len(x) for x in ss]; totL = sum(L)
    exp = [sum(L[:j+1]) / totL for j in range(k-1)]
    import itertools
    best = None
    if k > 1 and len(sil) >= k-1:
        for comb in itertools.combinations(sil, k-1):
            cost = sum(abs(((a+b)/2 - sp_start)/span - exp[j]) * 20 - dd * 2 for j, (a, b, dd) in enumerate(comb))
            W = [len(x.split()) for x in ss]; edges = [sp_start] + [x for c in comb for x in (c[0], c[1])] + [sp_end]
            for j in range(k):
                sd = max(0.05, edges[2*j+1] - edges[2*j]); v = W[j] / sd
                if v > 4.6: cost += (v - 4.6) * 6
                if v < 1.7: cost += (1.7 - v) * 6
            if best is None or cost < best[0]: best = (cost, comb)
    top = list(best[1]) if best else []
    if len(top) < k-1: print("WARN line", i+1, "found", len(top), "need", k-1)
    bounds=[sp_start]; segs=[]
    for a,b,_ in top:
        segs.append((bounds[-1], a)); bounds.append(b)
    segs.append((bounds[-1], sp_end))
    # если пауз не хватило — равномерно по длине текста
    if len(segs) != k:
        L=[len(x) for x in ss]; tot=sum(L); c=0; segs=[]
        for x in L:
            segs.append((raw[i]*c/tot, raw[i]*(c+x)/tot)); c+=x
    sents.append([{"t":ss[j],"from":round(starts[i]+segs[j][0]/TEMPO,3),"to":round(starts[i]+segs[j][1]/TEMPO,3)} for j in range(k)])
json.dump({"starts":starts,"ends":ends,"total":total,"sents":sents},open("src/voiceTiming.json","w"),ensure_ascii=False)
print("total",total,"words/s",sum(len(x.split()) for x in texts)/(sum(ds)))
for i,l in enumerate(sents):
    print(i+1,[(round(x["from"],2),round(x["to"],2),round(len(x["t"].split())/(x["to"]-x["from"]),1)) for x in l])

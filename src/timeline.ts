import { FPS } from "./config";
import timing from "./voiceTiming.json";
import texts from "./lines.json";

export const s = (sec: number) => Math.round(sec * FPS);

const N = texts.length;
export const LINES: { from: number; to: number; text: string }[] = texts.map((text, i) => ({
  from: timing.starts[i],
  to: timing.ends[i],
  text,
}));

export const IDS = ["hook", "why", "trick", "fake", "lock", "story", "fix", "outro"] as const;
export const STAGES = ["вопрос", "почему", "приём", "ловушка", "замочек", "дело", "защита", "итог"];
export const sceneStartSec = (i: number) => (i === 0 ? 0 : Math.max(0, timing.starts[i] - 0.06));
export const TOTAL = Math.ceil(timing.total * FPS);
export const SCENES = IDS.map((id, i) => {
  const from = s(sceneStartSec(i));
  const to = i === N - 1 ? TOTAL : s(sceneStartSec(i + 1));
  return { id, from, dur: to - from };
});

// сколько «звучит» слово (латиница и цифры читаются длиннее)
const SPOKEN: Record<string, number> = {
  "Wi-Fi": 7,
  "2024": 26,
};
const spokenLen = (w: string) => {
  const c = w.replace(/[«»"().,:;?!—]/g, "");
  if (SPOKEN[c] !== undefined) return SPOKEN[c];
  return c.replace(/[^\p{L}\p{N}]/gu, "").length;
};

type W = { t: string; from: number; to: number };
const SENTS: { t: string; from: number; to: number }[][] = (timing as any).sents;

// слова строки i с таймингом: внутри каждого предложения — пропорционально «звучанию» слов
const wordsOf = (i: number): W[] => {
  const out: W[] = [];
  for (const se of SENTS[i]) {
    const ws = se.t.split(/\s+/);
    const wt = ws.map((w) => spokenLen(w) + 1.5);
    const tot = wt.reduce((a, b) => a + b, 0);
    let t = se.from;
    ws.forEach((w, k) => {
      const d = ((se.to - se.from) * wt[k]) / tot;
      out.push({ t: w, from: t, to: t + d });
      t += d;
    });
  }
  return out;
};
const WORDS: W[][] = LINES.map((_, i) => wordsOf(i));

// секунды (от начала ролика), когда начинается слово, которое начинается с needle
export const tw = (i: number, needle: string, offSec = 0) => {
  const n = needle.toLowerCase();
  let w = WORDS[i].find((x) => x.t.toLowerCase().replace(/^[«"(]+/, "").startsWith(n));
  if (!w) {
    console.warn("tw: not found", i, needle);
    w = WORDS[i][0];
  }
  return w.from + offSec;
};

// кадр внутри сцены i, когда звучит слово needle
export const rel = (i: number, needle: string, offSec = 0) =>
  Math.round((tw(i, needle, offSec) - sceneStartSec(i)) * FPS);

// ---- субтитры по 1-3 слова ----
export type Word = { t: string; from: number; to: number };
export type Chunk = { from: number; to: number; words: Word[] };

const mk = (words: Word[]): Chunk => ({
  from: words[0].from,
  to: words[words.length - 1].to,
  words,
});

export const CHUNKS: Chunk[] = LINES.flatMap((_, li) => {
  const out: Chunk[] = [];
  let cur: Word[] = [];
  let chars = 0;
  for (const w of WORDS[li]) {
    const endsSent = /[.?!»]$/.test(cur.length ? cur[cur.length - 1].t : "");
    if (cur.length && (cur.length >= 3 || chars + w.t.length > 14 || endsSent)) {
      out.push(mk(cur));
      cur = [];
      chars = 0;
    }
    cur.push(w);
    chars += w.t.length + 1;
  }
  if (cur.length) out.push(mk(cur));
  return out;
}).map((c, i, arr) => ({ ...c, to: i < arr.length - 1 && arr[i + 1].from - c.to < 0.5 ? arr[i + 1].from : c.to }));

// начало предложения k строки i (сек от начала ролика) и кадр внутри сцены
export const sentStart = (i: number, k: number) => SENTS[i][Math.min(k, SENTS[i].length - 1)].from;
export const relSent = (i: number, k: number, offSec = 0) => Math.round((sentStart(i, k) + offSec - sceneStartSec(i)) * FPS);
export const sentEnd = (i: number, k: number) => SENTS[i][Math.min(k, SENTS[i].length - 1)].to;

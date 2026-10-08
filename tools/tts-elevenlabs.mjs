#!/usr/bin/env node
// Озвучка через ElevenLabs API. Ключ берётся из .env (ELEVENLABS_API_KEY), нигде не печатается.
// Использование: node tools/tts-elevenlabs.mjs --job queue/<id>.json
// Задача: { "action":"tts", "voiceId":"...", "modelId":"eleven_v3", "settings":{...},
//           "lines":[{"out":"public/vo2/l1.mp3","text":"..."}] }
// Или { "action":"tts", "listVoices": true } — список голосов (имя, id, язык).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');
const die = (m) => { console.error('✗ ' + m); process.exit(1); };
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
const KEY = process.env.ELEVENLABS_API_KEY || '';
if (!KEY) die('В .env нет ELEVENLABS_API_KEY');

const i = process.argv.indexOf('--job');
if (i < 0) die('нет --job');
const job = JSON.parse(fs.readFileSync(path.resolve(ROOT, process.argv[i + 1]), 'utf8'));
const API = 'https://api.elevenlabs.io';
const PUB = path.join(ROOT, 'public');
const inside = (base, p) => { const r = path.relative(base, p); return !!r && !r.startsWith('..') && !path.isAbsolute(r); };

async function main() {
  if (job.listVoices) {
    const r = await fetch(`${API}/v2/voices?page_size=100`, { headers: { 'xi-api-key': KEY }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) die(`voices: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    for (const v of d.voices || []) console.log(`VOICE ${v.voice_id} | ${v.name} | ${v.category} | ${JSON.stringify(v.labels || {})}`);
    const u = await fetch(`${API}/v1/user/subscription`, { headers: { 'xi-api-key': KEY }, signal: AbortSignal.timeout(30000) });
    if (u.ok) { const s = await u.json(); console.log(`CREDITS ${s.character_count}/${s.character_limit}`); }
    console.log('✓ Готово');
    return;
  }
  if (!job.voiceId || !/^[A-Za-z0-9]+$/.test(job.voiceId)) die('нет voiceId');
  const model = job.modelId || 'eleven_v3';
  for (const ln of job.lines || []) {
    const out = path.resolve(ROOT, ln.out);
    if (!inside(PUB, out) || !/\.mp3$/i.test(out)) die('out должен быть .mp3 внутри public/: ' + ln.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const body = { text: ln.text, model_id: model, voice_settings: { ...(job.settings || {}), ...(ln.settings || {}) } };
    if (job.languageCode) body.language_code = job.languageCode;
    let ok = false, lastErr = '';
    // сначала с таймингами символов (для точных субтитров), при отказе — обычный эндпоинт
    for (const ts of [true, false]) {
      for (let a = 0; a < 3 && !ok; a++) {
        try {
          const url = `${API}/v1/text-to-speech/${job.voiceId}${ts ? '/with-timestamps' : ''}?output_format=mp3_44100_128`;
          const r = await fetch(url, {
            method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify(body), signal: AbortSignal.timeout(180000),
          });
          if (!r.ok) { lastErr = `HTTP ${r.status} ${(await r.text()).slice(0, 400)}`; if (r.status < 500 && r.status !== 429) break; await new Promise((z) => setTimeout(z, 3000)); continue; }
          if (ts) {
            const d = await r.json();
            fs.writeFileSync(out, Buffer.from(d.audio_base64, 'base64'));
            fs.writeFileSync(out.replace(/\.mp3$/i, '.align.json'), JSON.stringify(d.alignment || d.normalized_alignment || null));
          } else {
            fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
          }
          console.log(`OK ${ln.out} ${fs.statSync(out).size}b${ts ? ' +timestamps' : ''}`);
          ok = true;
        } catch (e) { lastErr = String(e.message); }
      }
      if (ok) break;
    }
    if (!ok) die(`${ln.out}: ${lastErr}`);
  }
  console.log('✓ Готово');
}
main().then(() => process.exit(0), (e) => die(e.message));

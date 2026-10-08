#!/usr/bin/env node
// Фоновый помощник. Берёт задачи из queue/*.json и выполняет ТОЛЬКО четыре действия:
//   render   — рендер ролика Remotion в out/*.mp4
//   check    — проверка токена Instagram
//   refresh  — продление токена
//   publish  — публикация Reel (только если в задаче approved: true)
//   tts      — озвучка строк через ElevenLabs API в public/*.mp3
// Результат каждой задачи пишется в queue/done/<id>.result.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = process.env.IG_QUEUE_DIR ? path.resolve(process.env.IG_QUEUE_DIR) : path.join(ROOT, 'queue');
const DONE = path.join(QUEUE, 'done');
const OUT = path.join(ROOT, 'out');
const PUBLISH = path.join(ROOT, 'tools', 'publish-instagram.mjs');
const POLL_MS = 3000;
fs.mkdirSync(DONE, { recursive: true });

const log = (...a) => console.log(new Date().toISOString(), ...a);
const inside = (base, p) => {
  const r = path.relative(base, p);
  return !!r && !r.startsWith('..') && !path.isAbsolute(r);
};

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: ROOT, env: process.env });
    let out = '';
    const add = (d) => { out += d.toString(); if (out.length > 30000) out = out.slice(-30000); };
    p.stdout.on('data', add);
    p.stderr.on('data', add);
    const t = setTimeout(() => { out += '\n[таймаут, процесс остановлен]'; p.kill('SIGKILL'); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(t); resolve({ code: -1, out: String(e.message) }); });
    p.on('close', (code) => { clearTimeout(t); resolve({ code, out }); });
  });
}

function finish(id, jobFile, result) {
  const res = { id, finishedAt: new Date().toISOString(), ...result };
  if (res.log) res.log = String(res.log).slice(-4000);
  fs.writeFileSync(path.join(DONE, `${id}.result.json`), JSON.stringify(res, null, 2));
  try { fs.renameSync(jobFile, path.join(DONE, `${id}.job.json`)); } catch { /* уже перенесён */ }
  log(`задача ${id}: ${res.status}`);
}

async function handle(jobFile) {
  const id = path.basename(jobFile, '.json');
  let job;
  try { job = JSON.parse(fs.readFileSync(jobFile, 'utf8')); }
  catch { return finish(id, jobFile, { status: 'rejected', message: 'Некорректный JSON в задаче' }); }

  const action = job.action;

  if (action === 'render') {
    const comp = String(job.composition || '');
    if (!/^[A-Za-z0-9_-]+$/.test(comp)) return finish(id, jobFile, { action, status: 'rejected', message: 'Неверное имя композиции' });
    const output = path.resolve(ROOT, String(job.output || ''));
    if (!inside(OUT, output) || !/\.mp4$/i.test(output)) return finish(id, jobFile, { action, status: 'rejected', message: 'Результат должен быть .mp4 внутри out/' });
    fs.mkdirSync(path.dirname(output), { recursive: true });
    if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
      log('ставлю зависимости (npm install)…');
      const inst = await run('npm', ['install', '--no-audit', '--no-fund'], 15 * 60 * 1000);
      if (inst.code !== 0) return finish(id, jobFile, { action, status: 'error', message: 'npm install не удался', log: inst.out });
    }
    const r = await run('npx', ['remotion', 'render', 'src/index.ts', comp, path.relative(ROOT, output)], 30 * 60 * 1000);
    const ok = r.code === 0 && fs.existsSync(output);
    return finish(id, jobFile, { action, status: ok ? 'ok' : 'error', output: path.relative(ROOT, output), sizeBytes: ok ? fs.statSync(output).size : 0, log: r.out });
  }

  if (action === 'check' || action === 'refresh') {
    const r = await run(process.execPath, [PUBLISH, action], 2 * 60 * 1000);
    return finish(id, jobFile, { action, status: r.code === 0 ? 'ok' : 'error', log: r.out });
  }

  if (action === 'publish') {
    if (job.approved !== true) return finish(id, jobFile, { action, status: 'rejected', message: 'Нет подтверждения (approved: true). Публикация не выполнена.' });
    const video = path.resolve(ROOT, String(job.video || ''));
    const cap = path.resolve(ROOT, String(job.captionFile || ''));
    if (!inside(OUT, video) || !/\.mp4$/i.test(video) || !fs.existsSync(video)) return finish(id, jobFile, { action, status: 'rejected', message: 'Видео должно быть существующим .mp4 внутри out/' });
    if (!inside(QUEUE, cap) || !fs.existsSync(cap)) return finish(id, jobFile, { action, status: 'rejected', message: 'Файл описания должен лежать в queue/' });
    const args = [PUBLISH, 'publish', '--video', video, '--caption-file', cap, '--yes'];
    if (job.noFeed) args.push('--no-feed');
    if (Number.isFinite(job.thumbOffsetMs)) args.push('--thumb-offset', String(Math.round(job.thumbOffsetMs)));
    const r = await run(process.execPath, args, 20 * 60 * 1000);
    const ok = r.code === 0 && r.out.includes('✓ Опубликовано');
    const link = (r.out.match(/https:\/\/\S+/) || [])[0] || '';
    return finish(id, jobFile, { action, status: ok ? 'ok' : 'error', permalink: link, log: r.out });
  }

  if (action === 'tts') {
    const r = await run(process.execPath, [path.join(ROOT, 'tools', 'tts-elevenlabs.mjs'), '--job', jobFile], 15 * 60 * 1000);
    const ok = r.code === 0 && r.out.includes('✓ Готово');
    return finish(id, jobFile, { action, status: ok ? 'ok' : 'error', log: r.out });
  }

  finish(id, jobFile, { action: String(action), status: 'rejected', message: 'Неизвестное действие. Разрешены: render, check, refresh, publish, tts' });
}

let busy = false;
async function tick() {
  try { fs.writeFileSync(path.join(QUEUE, 'daemon.alive'), new Date().toISOString()); } catch { /* ignore */ }
  if (busy) return;
  const jobs = fs.readdirSync(QUEUE)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(QUEUE, f))
    .filter((f) => fs.statSync(f).isFile())
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (!jobs.length) return;
  busy = true;
  try { await handle(jobs[0]); }
  catch (e) { log('ошибка обработки:', e.message); try { finish(path.basename(jobs[0], '.json'), jobs[0], { status: 'error', message: String(e.message) }); } catch { /* ignore */ } }
  busy = false;
}

log('помощник запущен, очередь:', QUEUE);
setInterval(tick, POLL_MS);
tick();

#!/usr/bin/env node
// Публикация Reels в Instagram через официальный API (Instagram API with Instagram Login).
// Токен и ID берутся из .env (IG_ACCESS_TOKEN, IG_USER_ID). Токен нигде не печатается.
//
// Команды:
//   node tools/publish-instagram.mjs check
//   node tools/publish-instagram.mjs publish --video out/x.mp4 --caption-file caption.txt [--dry-run] [--yes]
//   node tools/publish-instagram.mjs refresh
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');

function die(msg, code = 1) {
  console.error('\n✗ ' + msg);
  process.exit(code);
}

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return; // в CI ключи приходят из окружения (GitHub Secrets)
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv();

const TOKEN = process.env.IG_ACCESS_TOKEN || '';
const USER_ID = process.env.IG_USER_ID || '';
const API_VERSION = process.env.IG_API_VERSION || 'v23.0';
const GRAPH = `https://graph.instagram.com/${API_VERSION}`;

if (!TOKEN) die('В .env нет IG_ACCESS_TOKEN');
if (!USER_ID) die('В .env нет IG_USER_ID');

const redact = (s) => String(s).split(TOKEN).join('***');

function hintFor(err) {
  const code = err.code, sub = err.error_subcode;
  if (code === 190) return 'Токен недействителен или истёк. Сгенерируй новый в Meta for Developers (Настройка API → Сгенерировать маркер) и замени IG_ACCESS_TOKEN в .env.';
  if (code === 10 || code === 200 || /permission/i.test(err.message || ''))
    return 'Не хватает прав. Нужно instagram_business_content_publish: добавь его в «Разрешения и функции» и сгенерируй токен заново.';
  if (code === 4 || code === 17 || code === 32 || code === 613) return 'Лимит запросов. Подожди и повтори позже.';
  if (code === 9 || sub === 2207042) return 'Достигнут суточный лимит публикаций.';
  if (sub === 2207026) return 'Неподдерживаемый формат видео. Нужен mp4 (H.264 + AAC), вертикальный 9:16.';
  return null;
}

async function call(method, url, { form, headers, body } = {}) {
  const init = { method, headers: { ...(headers || {}) } };
  if (form) init.body = new URLSearchParams(form);
  else if (body) init.body = body;
  let res;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new Error('Нет связи с Instagram API: ' + redact(e.cause?.code || e.message));
  }
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 500) }; }
  if (!res.ok || json.error) {
    const e = json.error || {};
    const msg = redact(e.message || json.raw || `HTTP ${res.status}`);
    const hint = hintFor(e);
    const err = new Error(`Instagram API: ${msg} (код ${e.code ?? res.status}${e.error_subcode ? '/' + e.error_subcode : ''})` + (hint ? `\n  → ${hint}` : ''));
    err.api = e;
    throw err;
  }
  return json;
}

const get = (p, params = {}) =>
  call('GET', `${GRAPH}/${p}?${new URLSearchParams({ ...params, access_token: TOKEN })}`);
const post = (p, form = {}) =>
  call('POST', `${GRAPH}/${p}`, { form: { ...form, access_token: TOKEN } });

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[k] = true;
      else { out[k] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

// Бесплатный способ без сторонних хранилищ: локальный сервер + Cloudflare quick tunnel (нужен cloudflared).
async function hostViaTunnel(videoPath) {
  const bins = ['cloudflared', '/opt/homebrew/bin/cloudflared', '/usr/local/bin/cloudflared'];
  const size = fs.statSync(videoPath).size;
  const name = encodeURIComponent(path.basename(videoPath));
  const server = http.createServer((req, res) => {
    const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    let start = 0, end = size - 1, status = 200;
    if (range) {
      if (range[1] !== '') start = parseInt(range[1], 10);
      if (range[2] !== '') end = Math.min(parseInt(range[2], 10), size - 1);
      if (range[1] === '' && range[2] !== '') { start = Math.max(size - parseInt(range[2], 10), 0); end = size - 1; }
      status = 206;
    }
    const h = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 };
    if (status === 206) h['Content-Range'] = `bytes ${start}-${end}/${size}`;
    res.writeHead(status, h);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(videoPath, { start, end }).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  let child = null, url = '', diag = '';
  for (const bin of bins) {
    try {
      const c = spawn(bin, ['tunnel', '--url', `http://127.0.0.1:${port}`, '--no-autoupdate'], { stdio: ['ignore', 'pipe', 'pipe'] });
      const found = await new Promise((resolve) => {
        let done = false;
        const fin = (v) => { if (!done) { done = true; resolve(v); } };
        const onData = (d) => { diag = (diag + String(d)).slice(-1200); const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d)); if (m) fin(m[0]); };
        c.stdout.on('data', onData); c.stderr.on('data', onData);
        c.on('error', (e) => { diag += '\nspawn error: ' + e.message; fin(''); });
        c.on('exit', () => fin(''));
        setTimeout(() => fin(''), 40000);
      });
      if (found) { child = c; url = found; break; }
      try { c.kill(); } catch {}
    } catch { /* пробуем следующий путь */ }
  }
  if (!url) { server.close(); console.log('    cloudflared не открыл туннель. Его вывод:\n' + diag.split('\n').map((l) => '    > ' + l).join('\n')); return null; }
  const stop = () => { try { child.kill(); } catch {} try { server.close(); } catch {} };
  process.on('exit', stop);
  const full = url + '/' + name;
  console.log('    туннель открыт: ' + url + ', проверяю доступность…');
  let last = '';
  for (let i = 0; i < 30; i++) {
    try {
      const h = await fetch(full, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
      if (h.ok) return full;
      last = 'HTTP ' + h.status;
    } catch (e) { last = e.cause?.code || e.message; }
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log('    туннель не отвечает с этого компьютера: ' + last);
  stop();
  return null;
}

async function hostVideo(videoPath) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(videoPath)], { type: 'video/mp4' }), path.basename(videoPath));
  let res;
  try { res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: fd }); }
  catch (e) { die('Не удалось выложить видео на временный хостинг: ' + (e.cause?.code || e.message)); }
  const txt = await res.text();
  let url = '';
  try { url = JSON.parse(txt).data?.url || ''; } catch { /* ниже ошибка */ }
  if (!res.ok || !url) die('Хостинг не вернул ссылку (HTTP ' + res.status + '): ' + txt.slice(0, 200));
  url = url.replace(/^http:/, 'https:').replace('tmpfiles.org/', 'tmpfiles.org/dl/');
  const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
  if (!head || !head.ok) die('Ссылка не открывается (' + (head ? head.status : 'нет связи') + '): ' + url);
  return url;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cmdCheck() {
  const me = await get('me', { fields: 'user_id,username,account_type' });
  console.log(`✓ Токен работает. Аккаунт: @${me.username} (${me.account_type || 'тип неизвестен'})`);
  if (me.user_id && String(me.user_id) !== String(USER_ID))
    console.log(`  ⚠ IG_USER_ID в .env (${USER_ID}) отличается от user_id из API (${me.user_id}). Если публикация не пойдёт, поставь значение из API.`);
  try {
    const lim = await get(`${USER_ID}/content_publishing_limit`, { fields: 'quota_usage,config' });
    const d = lim.data?.[0];
    if (d) console.log(`  Публикаций за последние 24 часа: ${d.quota_usage} из ${d.config?.quota_total ?? '?'}`);
  } catch { /* необязательная проверка */ }
  console.log('  Доступ к публикации Reels проверится при первой публикации.');
}

async function cmdRefresh() {
  const j = await call('GET', `https://graph.instagram.com/refresh_access_token?${new URLSearchParams({
    grant_type: 'ig_refresh_token', access_token: TOKEN })}`);
  if (!j.access_token) die('API не вернул новый токен');
  const src = fs.readFileSync(ENV_PATH, 'utf8');
  const next = src.replace(/^(\s*IG_ACCESS_TOKEN\s*=).*$/m, () => `IG_ACCESS_TOKEN=${j.access_token}`);
  fs.writeFileSync(ENV_PATH, next);
  console.log(`✓ Токен продлён и записан в .env. Действует ещё примерно ${Math.round((j.expires_in || 0) / 86400)} дн.`);
}

async function cmdPublish(args) {
  const videoArg = args.video || args._[1];
  if (!videoArg || videoArg === true) die('Укажи видео: --video out/ролик.mp4');
  const videoPath = path.resolve(process.cwd(), String(videoArg));
  if (!fs.existsSync(videoPath)) die('Файл не найден: ' + videoPath);
  if (!/\.mp4$/i.test(videoPath)) die('Нужен файл .mp4');
  const size = fs.statSync(videoPath).size;
  if (size > 300 * 1024 * 1024) die('Файл больше 300 МБ, Instagram такое не примет');

  let caption = '';
  if (args['caption-file'] && args['caption-file'] !== true)
    caption = fs.readFileSync(path.resolve(process.cwd(), String(args['caption-file'])), 'utf8').trim();
  else if (args.caption && args.caption !== true) caption = String(args.caption).trim();
  if (!caption) die('Нужно описание: --caption-file caption.txt или --caption "текст"');
  if (caption.length > 2200) die(`Описание ${caption.length} символов, максимум 2200`);
  const tags = (caption.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  if (tags > 30) die(`Хештегов ${tags}, максимум 30`);

  console.log('— Публикация Reel —');
  console.log(`Аккаунт ID: ${USER_ID}`);
  console.log(`Видео:      ${videoPath} (${(size / 1024 / 1024).toFixed(1)} МБ)`);
  console.log(`Хештегов:   ${tags}, символов в описании: ${caption.length}`);
  console.log('Описание:\n' + caption.split('\n').map((l) => '  | ' + l).join('\n'));

  if (args['dry-run']) { console.log('\n✓ Проверка пройдена. Ничего не отправлено (--dry-run).'); return; }

  if (!args.yes) {
    if (!process.stdin.isTTY) die('Без интерактивного терминала нужен флаг --yes');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = (await rl.question('\nОпубликовать? (да/нет): ')).trim().toLowerCase();
    rl.close();
    if (!['да', 'y', 'yes', 'д'].includes(ans)) die('Отменено, ничего не опубликовано.', 0);
  }

  console.log('\n1/4 Создаю контейнер…');
  let videoUrl = args['video-url'] && args['video-url'] !== true ? String(args['video-url']) : '';
  if (!videoUrl) {
    console.log('0/4 Instagram берёт Reels только по публичной ссылке. Открываю временный туннель (cloudflared)…');
    videoUrl = await hostViaTunnel(videoPath);
    if (!videoUrl) die('Не удалось открыть туннель для видео (подробности выше). Публикация остановлена.');
    console.log('    ссылка: ' + videoUrl);
  }
  const form = { media_type: 'REELS', caption, share_to_feed: args['no-feed'] ? 'false' : 'true', video_url: videoUrl };
  if (args['thumb-offset'] && args['thumb-offset'] !== true) form.thumb_offset = String(args['thumb-offset']);
  const container = await post(`${USER_ID}/media`, form);
  if (!container.id || (!videoUrl && !container.uri)) die('API не вернул id/uri для загрузки');

  console.log('2/4 Загружаю видео…');
  if (!videoUrl) {
    const buf = fs.readFileSync(videoPath);
    const up = await call('POST', container.uri, {
      headers: { Authorization: `OAuth ${TOKEN}`, offset: '0', file_size: String(size) },
      body: buf,
    });
    if (up.success === false) die('Загрузка не удалась: ' + redact(JSON.stringify(up)));
  } else console.log('    (Instagram сам скачает видео по ссылке)');

  console.log('3/4 Жду обработку Instagram…');
  let status = '';
  for (let i = 0; i < 90; i++) {
    const s = await get(container.id, { fields: 'status_code,status' });
    status = s.status_code;
    process.stdout.write(`\r    статус: ${status}   `);
    if (status === 'FINISHED') break;
    if (status === 'ERROR' || status === 'EXPIRED') { console.log(); die(`Обработка не удалась (${status}): ${redact(s.status || '')}`); }
    await sleep(5000);
  }
  console.log();
  if (status !== 'FINISHED') die('Instagram слишком долго обрабатывает видео. Контейнер не опубликован, повтори позже.');

  console.log('4/4 Публикую…');
  const pub = await post(`${USER_ID}/media_publish`, { creation_id: container.id });
  let link = '';
  try { link = (await get(pub.id, { fields: 'permalink' })).permalink || ''; } catch { /* ссылка необязательна */ }
  console.log(`\n✓ Опубликовано. ID: ${pub.id}${link ? '\n  ' + link : ''}`);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
try {
  if (cmd === 'check') await cmdCheck();
  else if (cmd === 'publish') { await cmdPublish(args); process.exit(0); }
  else if (cmd === 'refresh') await cmdRefresh();
  else {
    console.log('Использование:\n  check\n  publish --video <файл.mp4> --caption-file <caption.txt> [--dry-run] [--yes] [--thumb-offset мс] [--no-feed]\n  refresh');
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  die(redact(e.message || e));
}

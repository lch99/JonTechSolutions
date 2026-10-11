// Renders video.html, frame by frame, to:
//   the ad cuts in out/ (1080 wide, 30fps, H.264 + AAC, music from soundtrack.py), plus cover-<format>.png
//     jontech-xhs.mp4           9:16  Xiaohongshu           (+ jontech-xhs-silent.mp4 for adding a track in the app)
//     jontech-meta-stories.mp4  9:16  Facebook/Instagram Stories
//     jontech-meta-reels.mp4    9:16  Reels (text kept out of the top 14% and bottom 35%)
//     jontech-meta-feed.mp4     4:5   Facebook/Instagram Feed
//   with --cut short, the 20s version of each (…-short.mp4): cuts.json lists the [from, to, speed] pieces of the
//   timeline it plays back to back — every piece starts and ends under a wipe or between two shots, so the joins
//   don't show
//   the website's product loop in ../../assets/reel/ — reel-<en|ms|zh>.mp4 + .webp poster: the six product shots
//   only, silent, 720 wide, starting on a finished shot so the poster matches the first frame
// Needs ffmpeg on PATH, the soundtrack (python soundtrack.py [short]) and the Playwright install from ../../tests
// (cd tests && npm install && npm run browsers).
// Usage:  node render.mjs [--cut short]                 every ad format
//         node render.mjs --format meta-feed,meta-reels just those
//         node render.mjs --format web [--lang en,zh]   the website loop
//         node render.mjs --stills 1,5,9                PNG stills at those seconds into out/stills/, no video
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out'), REEL = path.join(HERE, '../../assets/reel');
const FPS = 30, COVER_AT = 3.5;
const ADS = { xhs: 1920, 'meta-stories': 1920, 'meta-reels': 1920, 'meta-feed': 1350 };
const WEB = { height: 1320, from: 10, to: 40, start: 13.6, width: 720 };
const CUTS = JSON.parse(fs.readFileSync(path.join(HERE, 'cuts.json'), 'utf8'));
const { chromium } = createRequire(path.join(HERE, '../../tests/package.json'))('playwright');

const arg = name => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1].split(',') : null; };
const stills = arg('--stills')?.map(Number);
const cut = arg('--cut')?.[0] ?? 'full', suffix = cut === 'full' ? '' : `-${cut}`;
if (!CUTS[cut]) throw new Error(`unknown cut "${cut}" — one of ${Object.keys(CUTS).join(', ')}`);
const jobs = (arg('--format') ?? Object.keys(ADS)).flatMap(format => {
  if (format !== 'web' && !ADS[format]) throw new Error(`unknown format "${format}" — one of ${Object.keys(ADS).join(', ')}, web`);
  return (arg('--lang') ?? (format === 'web' ? ['en', 'ms', 'zh'] : ['zh'])).map(lang => ({ format, lang }));
});
const music = path.join(OUT, `soundtrack${suffix}.wav`);
if (!stills && jobs.some(j => j.format !== 'web') && !fs.existsSync(music)) throw new Error(`${path.basename(music)} is missing — run \`python soundtrack.py${suffix.replace('-', ' ')}\` first`);

const ffmpeg = (args, stdin = 'inherit') => {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: [stdin, 'inherit', 'inherit'] });
  return { stdin: p.stdin, done: once(p, 'close').then(([code]) => { if (code) throw new Error(`ffmpeg exited with ${code}`); }) };
};
const PNG_IN = ['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-'];
const H264 = (crf, scale = '') => [
  '-vf', `scale=${scale}out_color_matrix=bt709:out_range=tv,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart',
];
// The timeline second shown by each output frame of a [from, to, speed] piece
const piece = ([from, to, speed]) => Array.from({ length: Math.round((to - from) / speed * FPS) }, (_, f) => from + f * speed / FPS);

for (const dir of [path.join(OUT, 'stills'), REEL]) fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();

async function render({ format, lang }) {
  const web = format === 'web', name = web ? `reel-${lang}` : `jontech-${format}${suffix}`;
  const page = await browser.newPage({ viewport: { width: 1080, height: web ? WEB.height : ADS[format] }, deviceScaleFactor: 1 });
  await page.goto(`${pathToFileURL(path.join(HERE, 'video.html')).href}?render&format=${format}&lang=${lang}&cut=${web ? 'full' : cut}`);
  await page.evaluate(() => window.prepare());
  const cdp = await page.context().newCDPSession(page);
  const frame = async seconds => {
    await page.evaluate(ms => window.seek(ms), seconds * 1000);
    return Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true })).data, 'base64');
  };
  const encode = async (args, times) => {
    const enc = ffmpeg([...PNG_IN, ...args], 'pipe');
    for (const [i, t] of times.entries()) {
      if (!enc.stdin.write(await frame(t))) await once(enc.stdin, 'drain');
      if (i % 300 === 0 && times.length > 1) console.log(`${name}: frame ${i}/${times.length}`);
    }
    enc.stdin.end();
    await enc.done;
  };

  if (stills) {
    for (const s of stills) fs.writeFileSync(path.join(OUT, 'stills', `${format}-${lang}${suffix}-${s}s.png`), await frame(s));
  } else if (web) {
    // The loop is circular, so it can start anywhere: begin on a finished shot and use that frame as the poster.
    const span = WEB.to - WEB.from, scale = `${WEB.width}:-2:flags=lanczos`;
    await encode(['-vf', `scale=${scale}`, '-c:v', 'libwebp', '-quality', '82', '-frames:v', '1', path.join(REEL, `${name}.webp`)], [WEB.start]);
    await encode(['-an', ...H264(27, `${scale}:`), path.join(REEL, `${name}.mp4`)], piece([0, span, 1]).map(t => WEB.from + (WEB.start - WEB.from + t) % span));
    console.log('wrote', path.join(REEL, `${name}.mp4`));
  } else {
    const file = path.join(OUT, `${name}.mp4`);
    fs.writeFileSync(path.join(OUT, `cover-${format}${suffix}.png`), await frame(COVER_AT));
    await encode(['-i', music, ...H264(16), '-c:a', 'aac', '-b:a', '192k', '-shortest', file], CUTS[cut].flatMap(piece));
    if (format === 'xhs') {
      await ffmpeg(['-i', file, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
        '-c:a', 'aac', '-shortest', '-movflags', '+faststart', path.join(OUT, `jontech-xhs-silent${suffix}.mp4`)]).done;
    }
    console.log('wrote', file);
  }
  await page.close();
}

await Promise.all(jobs.map(render));
await browser.close();

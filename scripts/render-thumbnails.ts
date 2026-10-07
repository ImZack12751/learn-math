/**
 * Renders build-time fractal images into public/generated:
 *   thumbs/<topic>.webp (512 px) and thumbs/<topic>-256.webp, one per curriculum topic;
 *   stills/<theme>-<kind>.webp, the reduced-motion and no-WebGL fallback for each theme.
 * Images are skipped when they already exist for the current RENDER_VERSION.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { topics } from '../src/content/curriculum';
import { renderRgb } from '../src/fractal/cpu';
import { fingerprint } from '../src/fractal/fingerprint';
import {
  RENDER_VERSION,
  STILL_SIZE,
  THUMBNAIL_SIZE,
  THUMBNAIL_STYLE,
  stillParams,
  stillPath,
  thumbnailParams,
  thumbnailPath,
} from '../src/fractal/stills';
import { FRACTAL_KINDS } from '../src/fractal/types';
import type { Theme } from '../src/themes/types';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'public');
const manifestFile = join(out, 'generated', 'manifest.json');

function prepare() {
  const current = existsSync(manifestFile)
    ? (JSON.parse(readFileSync(manifestFile, 'utf8')) as { version: number }).version
    : -1;
  if (current !== RENDER_VERSION) rmSync(join(out, 'generated'), { recursive: true, force: true });
  mkdirSync(join(out, 'generated', 'thumbs'), { recursive: true });
  mkdirSync(join(out, 'generated', 'stills'), { recursive: true });
}

async function loadThemes(): Promise<Theme[]> {
  const dir = join(root, 'src', 'themes');
  const files = readdirSync(dir).filter((f) => f.endsWith('.theme.ts'));
  const mods = await Promise.all(
    files.map((f) => import(pathToFileURL(join(dir, f)).href) as Promise<{ default: Theme }>),
  );
  return mods.map((m) => m.default);
}

const webp = (rgb: Uint8Array, width: number, height: number) =>
  sharp(rgb, { raw: { width, height, channels: 3 } }).webp({ quality: 82, effort: 5 });

async function main() {
  const started = performance.now();
  prepare();
  let rendered = 0;

  for (const topic of topics) {
    const large = join(out, thumbnailPath(topic.id, 512));
    const small = join(out, thumbnailPath(topic.id, 256));
    if (existsSync(large) && existsSync(small)) continue;
    const rgb = renderRgb(
      THUMBNAIL_SIZE,
      THUMBNAIL_SIZE,
      thumbnailParams(fingerprint(topic.id)),
      THUMBNAIL_STYLE,
    );
    await webp(rgb, THUMBNAIL_SIZE, THUMBNAIL_SIZE).toFile(large);
    await webp(rgb, THUMBNAIL_SIZE, THUMBNAIL_SIZE).resize(256, 256).toFile(small);
    rendered++;
  }

  for (const theme of await loadThemes()) {
    for (const kind of FRACTAL_KINDS) {
      const file = join(out, stillPath(theme.id, kind));
      if (existsSync(file)) continue;
      const { width, height } = STILL_SIZE;
      await webp(
        renderRgb(width, height, stillParams(kind), theme.fractal, 1),
        width,
        height,
      ).toFile(file);
      rendered++;
    }
  }

  writeFileSync(manifestFile, JSON.stringify({ version: RENDER_VERSION }));
  const seconds = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`fractal images: ${rendered} rendered, others up to date (${seconds} s)`);
}

await main();

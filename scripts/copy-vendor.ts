/**
 * Copies third-party runtime assets into public/generated so they are served from the app itself:
 * MathLive's fonts (the app runs offline and loads nothing from a CDN).
 */
import { cpSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = join(root, 'public', 'generated', 'mathlive', 'fonts');
mkdirSync(target, { recursive: true });
cpSync(join(root, 'node_modules', 'mathlive', 'fonts'), target, { recursive: true });
console.log('vendor assets: MathLive fonts copied');

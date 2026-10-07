/**
 * GitHub Pages has no single-page-app rewrite. Serving index.html as 404.html makes deep links
 * (for example /learn-math/topic/s1-decimals) load the app, which then routes client-side.
 */
import { copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '..', 'dist');
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
console.log('spa fallback: dist/404.html written');

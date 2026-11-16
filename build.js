import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const isWatch = process.argv.includes('--watch');
const outDir = resolve('dist');
const anilistClientId = process.env.BOANIMES_ANILIST_CLIENT_ID || '';

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

async function buildAll() {
  try {
    // Build content scripts as IIFE (not ESM) - they run in page context
    await build({
      entryPoints: ['src/content/main.ts', 'src/content/early.ts'],
      bundle: true,
      outdir: join(outDir, 'content'),
      format: 'iife',
      target: 'chrome100',
      platform: 'browser',
      splitting: false,
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome'],
    });
    
    // Build popup
    await build({
      entryPoints: ['src/popup/popup.ts'],
      bundle: true,
      outfile: join(outDir, 'popup.js'),
      format: 'esm',
      target: 'chrome100',
      platform: 'browser',
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome'],
      define: { BOANIMES_ANILIST_CLIENT_ID: JSON.stringify(anilistClientId) }
    });
    
    // Build background
    await build({
      entryPoints: ['src/background/service-worker.ts'],
      bundle: true,
      outfile: join(outDir, 'background.js'),
      format: 'esm',
      target: 'chrome100',
      platform: 'browser',
      minify: !isWatch,
      sourcemap: isWatch,
      external: ['chrome']
    });
    
    // Copy static files
    copyFileSync('manifest.json', join(outDir, 'manifest.json'));
    copyFileSync('popup.html', join(outDir, 'popup.html'));
    
    // Copy styles
    const stylesDir = join(outDir, 'styles');
    if (!existsSync(stylesDir)) mkdirSync(stylesDir, { recursive: true });
    if (existsSync('src/styles')) {
      readdirSync('src/styles').forEach(f => {
        copyFileSync(join('src/styles', f), join(stylesDir, f));
      });
    }
    
    // Ícones da extensão (PNG: o Chrome não aceita SVG no manifest)
    const iconsDir = join(outDir, 'icons');
    if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
    if (existsSync('public/icons')) {
      readdirSync('public/icons').filter(f => f.endsWith('.png')).forEach(f => {
        copyFileSync(join('public/icons', f), join(iconsDir, f));
      });
    }
    
    console.log('[BOAnimes] Build complete:', new Date().toLocaleTimeString());
  } catch (e) {
    console.error('[BOAnimes] Build failed:', e);
    process.exit(1);
  }
}

buildAll();

if (isWatch) {
  console.log('[BOAnimes] Watching for changes...');
}

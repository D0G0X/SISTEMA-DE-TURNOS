import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(join(root, 'index.html'), join(dist, 'index.html'));
cpSync(join(root, 'src'), join(dist, 'src'), { recursive: true });
cpSync(join(root, 'public'), join(dist, 'public'), { recursive: true });

if (existsSync(join(root, 'favicon.ico'))) {
  cpSync(join(root, 'favicon.ico'), join(dist, 'favicon.ico'));
}

console.log('Frontend preparado para Vercel en dist/.');

// Carga server/.env y prioriza sus valores sobre variables del sistema.
import { parseEnv } from 'node:util';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = join(dirname(fileURLToPath(import.meta.url)), '.env');

if (existsSync(envPath)) {
  try {
    const raw = readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
    Object.assign(process.env, parseEnv(raw));
  } catch (err) {
    console.warn('No se pudo cargar .env:', err.message);
  }
}

// Servicio en segundo plano: revisa turnos periódicamente y actualiza estados con IA.
import './env.mjs';
import pg from 'pg';
import { env } from 'node:process';
import { trackAll } from './ai-tracking.mjs';

const INTERVAL_MS = Number(env.TRACKER_INTERVAL_MS || 60_000);
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL || 'postgresql://turnos:turnos@localhost:5433/turnos',
});

pool.on('error', (err) => console.error('Tracker: error del pool —', err.message));

async function runCycle() {
  try {
    const { total, updated } = await trackAll(pool);
    const stamp = new Date().toISOString();
    console.log(`[${stamp}] Seguimiento IA: ${updated}/${total} turnos actualizados`);
  } catch (err) {
    console.error('Tracker: ciclo fallido —', err.message);
  }
}

console.log(`Seguimiento IA activo (cada ${INTERVAL_MS / 1000}s). Ctrl+C para detener.`);
await runCycle();
setInterval(runCycle, INTERVAL_MS);

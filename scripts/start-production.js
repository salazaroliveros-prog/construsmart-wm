/**
 * CONSTRUCTORA WM/M&S - PRODUCTION SERVER OPTIMIZER
 * Slogan: "CONSTRUYENDO EL FUTURO"
 * 
 * Arranca Next.js en producción con optimizaciones de memoria:
 * - Límite de memoria controlado (evita cierres por OOM)
 * - Flags optimizados de V8 para servidores de larga duración
 * - Compresión habilitada (next.config.ts)
 * - Trabaja con PM2 para escalamiento multi-core:
 *   pm2 start scripts/start-production.js --name "erp-wm" -i 4
 * 
 * Uso:
 *   node scripts/start-production.js
 *   npm run start:prod
 *   pm2 start scripts/start-production.js -i 4  (4 instances = 4 cores)
 */

'use strict';

const os = require('os');
const { spawn } = require('child_process');

// ============ CONFIGURACIÓN ============
const DEFAULT_PORT = process.env.PORT || 3000;
const TOTAL_RAM_MB = os.totalmem() / 1024 / 1024;
// Usar máximo 60% de RAM disponible para Node.js (deja espacio para OS, VSCode, etc.)
const NODE_MEMORY_MB = process.env.NODE_MEMORY_LIMIT_MB
  ? parseInt(process.env.NODE_MEMORY_LIMIT_MB, 10)
  : Math.floor(TOTAL_RAM_MB * 0.6);

const NUM_CPUS = os.cpus().length;

// Determinar nivel de concurrencia recomendado
const recommendedWorkers = Math.min(NUM_CPUS, Math.floor(TOTAL_RAM_MB / 2048), 6);

console.log('========================================');
console.log('🚀 CONSTRUCTORA WM/M&S - PRODUCTION SERVER');
console.log('========================================');
console.log(`💻 Sistema detectado:`);
console.log(`   - CPUs: ${NUM_CPUS}`);
console.log(`   - RAM Total: ${(TOTAL_RAM_MB / 1024).toFixed(1)} GB`);
console.log(`   - Memoria asignada a Node: ${NODE_MEMORY_MB} MB (60% de RAM)`);
console.log(`   - Puerto: ${DEFAULT_PORT}`);
console.log(`   - Concurrencia recomendada (instancias): ${recommendedWorkers}`);
console.log(`   - Comando PM2 sugerido: pm2 start scripts/start-production.js -i ${recommendedWorkers}`);
console.log('========================================\n');

// ============ FLAGS DE NODE.JS ============
const nodeFlags = [
  `--max-old-space-size=${NODE_MEMORY_MB}`,      // Límite de memoria heap
  '--max-http-header-size=16384',                 // Headers más grandes (para auth tokens)
];

// ============ VARIABLES DE ENTORNO ============
const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
};

// ============ ARRANCAR NEXT.JS ============
console.log('[Server] Iniciando Next.js en producción...');
console.log(`[Server] Flags Node.js: ${nodeFlags.join(' ')}`);
console.log('[Server] Control+C para detener\n');

const nextProcess = spawn(
  'node',
  [...nodeFlags, 'node_modules/next/dist/bin/next', 'start', '-p', String(DEFAULT_PORT)],
  {
    stdio: 'inherit',
    env,
  }
);

nextProcess.on('exit', (code, signal) => {
  console.log(`[Server] Next.js salió con código ${code} (${signal || 'normal'})`);
  process.exit(code || 0);
});

nextProcess.on('error', (err) => {
  console.error('[Server] Error al iniciar Next.js:', err);
  process.exit(1);
});

// Manejo de señales para graceful shutdown
process.on('SIGINT', () => nextProcess.kill('SIGINT'));
process.on('SIGTERM', () => nextProcess.kill('SIGTERM'));
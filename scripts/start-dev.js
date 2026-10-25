import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Cohesora Platform (API Server + Vite Web)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Spawn API Server
const apiProcess = spawn(npmCmd, ['run', 'dev', '--workspace=apps/api'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

// Spawn Web Frontend Dev Server
const webProcess = spawn(npmCmd, ['run', 'dev', '--workspace=apps/web'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

function cleanup() {
  console.log('\n🛑 Shutting down Cohesora dev servers...');
  try {
    apiProcess.kill();
  } catch (e) {}
  try {
    webProcess.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

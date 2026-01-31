import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const electronPath = require('electron');

// Remove ELECTRON_RUN_AS_NODE so Electron runs as Electron, not Node.
// VSCode sets this in its integrated terminal because VSCode itself is Electron.
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env,
  cwd: process.cwd(),
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

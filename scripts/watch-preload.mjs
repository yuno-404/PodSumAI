import { spawn } from 'child_process';
import { watch } from 'fs';
import { rename, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Start TypeScript compiler in watch mode
const tsc = spawn('tsc', ['-p', 'tsconfig.preload.json', '--watch'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// Watch for the compiled file and rename it
const outputPath = join(projectRoot, 'dist-electron/preload/index.js');
const targetPath = join(projectRoot, 'dist-electron/preload/index.cjs');

function renameFile() {
  if (existsSync(outputPath)) {
    rename(outputPath, targetPath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error renaming preload file:', err);
      }
    });
  }
}

// Initial rename after a delay to let tsc compile
setTimeout(renameFile, 2000);

// Watch for changes
const preloadDir = join(projectRoot, 'dist-electron/preload');
try {
  watch(preloadDir, { persistent: true }, (eventType, filename) => {
    if (filename === 'index.js') {
      setTimeout(renameFile, 100);
    }
  });
} catch (err) {
  // Directory might not exist yet
  console.log('Watching for preload directory...');
}

process.on('SIGINT', () => {
  tsc.kill();
  process.exit();
});

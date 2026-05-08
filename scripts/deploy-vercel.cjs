const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const npmCache = path.join(root, '.npm-cache');

function run(command, args, label) {
  console.log(`\n> ${label}`);
  console.log(`$ ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      npm_config_cache: npmCache
    },
    shell: false,
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`\n${label} failed: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\n${label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

run(npmCommand, ['run', 'build'], 'Build Angular app');
run(npxCommand, ['--yes', 'vercel', '--prod'], 'Deploy to Vercel production');


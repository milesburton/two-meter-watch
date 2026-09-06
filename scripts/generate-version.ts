import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json' with { type: 'json' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'frontend', 'public', 'version.json');

function getGitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

const versionInfo = {
  version: pkg.version,
  gitSha: getGitSha(),
  builtAt: new Date().toISOString(),
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(versionInfo, null, 2)}\n`);

// eslint-disable-next-line no-console
console.log(`Wrote ${outPath}`);
// eslint-disable-next-line no-console
console.log(versionInfo);

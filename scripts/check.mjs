import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
for (const dir of ['public', 'worker', 'scripts', 'tests']) {
  for (const file of readdirSync(dir)) {
    if (/\.m?js$/.test(file)) execFileSync(process.execPath, ['--check', `${dir}/${file}`], { stdio: 'inherit' });
  }
}
console.log('Sintaxe JavaScript verificada.');

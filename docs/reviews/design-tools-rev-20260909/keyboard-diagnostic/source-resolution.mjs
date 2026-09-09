// Successful read-only resolution approach used for this diagnostic, from the fixture cwd.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const projectRequire = createRequire(process.cwd() + '/package.json');
const radixRequire = createRequire(projectRequire.resolve('radix-ui'));
for (const name of ['@radix-ui/react-radio-group', '@radix-ui/react-roving-focus']) {
  const source = fs.readFileSync(radixRequire.resolve(name), 'utf8');
  fs.writeFileSync('/tmp/design-tools-rev-20260909/keyboard-diagnostic/' + name.split('/')[1] + '-installed-source.js', source);
}

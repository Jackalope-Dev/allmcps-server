#!/usr/bin/env node
// Runs from the npm "version" lifecycle hook (see package.json), after npm has
// already written the new version into package.json but before it commits and
// tags. Propagates that same version into server.json (both the top-level
// version and packages[0].version) and lhm.plugin.json, so a single
// `npm version <bump>` keeps every manifest — and the eventual git tag — in
// lockstep instead of relying on hand-editing three files per release.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
);

function updateJson(relPath, mutate) {
  const path = join(root, relPath);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  mutate(data);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`synced ${relPath} -> ${version}`);
}

updateJson('server.json', (data) => {
  data.version = version;
  if (data.packages?.[0]) data.packages[0].version = version;
});

updateJson('lhm.plugin.json', (data) => {
  data.version = version;
});

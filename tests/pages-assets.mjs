// Run after `npm run build`. Reproduce URL resolution on a GitHub project site.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dist = new URL('../dist/', import.meta.url);
const site = new URL('https://example.invalid/repo_ani/');

async function readAsset(reference, relativeTo) {
  const resolved = new URL(reference, relativeTo);
  assert.equal(resolved.origin, site.origin, `Unexpected external asset: ${reference}`);
  assert.ok(resolved.pathname.startsWith(site.pathname), `Asset escapes /repo_ani/: ${reference}`);
  const result = await readFile(new URL(resolved.pathname.slice(site.pathname.length), dist));
  assert.ok(result.length > 0, `Empty asset: ${reference}`);
  return { resolved, result };
}

test('the production HTML, scripts, styles, icons, and fonts work below /repo_ani/', async () => {
  const html = await readFile(new URL('index.html', dist), 'utf8');
  const references = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(references.some((r) => r.endsWith('.js')), 'Missing application entry point');
  assert.ok(references.some((r) => r.endsWith('.css')), 'Missing stylesheet');
  for (const reference of references) {
    const { resolved, result } = await readAsset(reference, site);
    if (!resolved.pathname.endsWith('.css')) continue;
    for (const match of result.toString('utf8').matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      if (!match[1].startsWith('data:')) await readAsset(match[1], resolved);
    }
  }
});

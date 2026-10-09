// Release checks for the portfolio. No dependencies. Run after `npm run build`.
// Point at a different build output with VERIFY_DIST=<dir> (default: ./dist).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.env.VERIFY_DIST || join(root, 'dist'));
const expectedOrder = ['hive', 'amphibious-robot', 'autonomous-drone', 'robotic-arm', 'ros2-micromouse-sync', 'jarvis-agentic-orchestrator', 'act-training'];
const forbiddenKeys = ['source', 'sources', 'notes', 'kind', 'featured'];
const forbiddenBundleText = ['Use only the supplied', 'Source: https://github.com', 'user confirmed', 'README conflicts', 'Do not add an unverified'];
const errors = [];
const fail = message => errors.push(message);

function walk(dir, accept = () => true) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full, accept) : accept(full) ? [full] : [];
  });
}
const rel = file => relative(root, file).split('\\').join('/');
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));

// 1. Project order.
const projectsFile = join(root, 'src/data/projects.json');
const { projects } = readJson(projectsFile);
const order = projects.map(project => project.id);
if (JSON.stringify(order) !== JSON.stringify(expectedOrder)) {
  fail(`Project order is [${order.join(', ')}]; expected [${expectedOrder.join(', ')}].`);
}

// 2. Forbidden keys at any depth in project and schematic objects.
function findKeys(value, path, hits) {
  if (Array.isArray(value)) value.forEach((item, index) => findKeys(item, `${path}[${index}]`, hits));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.includes(key)) hits.push(`${path}.${key}`);
      findKeys(child, `${path}.${key}`, hits);
    }
  }
}
const keyHits = [];
findKeys(projects, 'projects', keyHits);
findKeys(readJson(join(root, 'src/data/schematics.json')), 'schematics', keyHits);
if (keyHits.length) fail(`Forbidden keys (${forbiddenKeys.join(', ')}) found: ${keyHits.join(', ')}`);

// 3 + 4. Media references versus files in public/media.
const srcFiles = walk(join(root, 'src'), file => /\.(json|jsx?|css|html)$/.test(file));
const referenced = new Set();
const mediaPattern = /\.\/media\/[^"'`\s)\\]+/g;
for (const file of srcFiles.filter(file => /\.(json|jsx)$/.test(file))) {
  for (const match of readFileSync(file, 'utf8').matchAll(mediaPattern)) {
    const path = match[0];
    referenced.add(path.slice('./media/'.length));
    if (!existsSync(join(root, 'public', path.slice(2)))) fail(`${rel(file)} references ${path}, which is missing from public/.`);
  }
}
const mediaDir = join(root, 'public/media');
const mediaFiles = walk(mediaDir).map(file => relative(mediaDir, file).split('\\').join('/'));
const sourceText = srcFiles.map(file => readFileSync(file, 'utf8')).join('\n');
for (const name of mediaFiles) {
  if (!sourceText.includes(`media/${name}`)) fail(`public/media/${name} is not referenced anywhere in src/ (orphan).`);
}

// 5. Forbidden text in the built JavaScript.
let bundles = [];
if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  fail(`Build output not found at ${dist}. Run \`npm run build\` first (or set VERIFY_DIST).`);
} else {
  bundles = walk(join(dist, 'assets'), file => file.endsWith('.js'));
  if (!bundles.length) fail(`No JavaScript bundles found in ${join(dist, 'assets')}.`);
  for (const file of bundles) {
    const text = readFileSync(file, 'utf8');
    for (const phrase of forbiddenBundleText) {
      if (text.includes(phrase)) fail(`${relative(dist, file).split('\\').join('/')} contains forbidden text: "${phrase}".`);
    }
  }
}

if (errors.length) {
  console.error(`verify FAILED (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`verify OK: ${order.length} projects in order, ${referenced.size} media references resolved, ${mediaFiles.length} media files all referenced, ${bundles.length} bundle(s) clean.`);

// Release checks for the portfolio. No dependencies. Run after `npm run build`.
// Point at a different build output with VERIFY_DIST=<dir> (default: ./dist).
// VERIFY_SKIP_DIST=1 skips only the dist bundle checks (use before a build exists); data and media checks still run.
// VERIFY_ROOT=<dir> checks a different project root (default: this repo; used by the fixture self-test).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.env.VERIFY_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..'));
const dist = resolve(process.env.VERIFY_DIST || join(root, 'dist'));
const skipDist = process.env.VERIFY_SKIP_DIST === '1';
const expectedOrder = ['hive', 'robotic-arm', 'amphibious-robot', 'ros2-micromouse-sync', 'act-training', 'autonomous-drone', 'jarvis-agentic-orchestrator'];
const allowedDomains = ['Mechanical', 'Software', 'Learning'];
const allowedMediaTypes = ['image', 'video'];
const requiredText = ['name', 'status', 'role', 'team', 'timeline', 'summary', 'problem'];
const forbiddenKeys = ['source', 'sources', 'notes', 'kind', 'featured'];
// `source` is a real field on results[] items and `kind` on links[] items; everywhere else they stay forbidden.
const allowedKeyParent = { source: /^projects\[\d+\]\.results\[\d+\]$/, kind: /^projects\[\d+\]\.links\[\d+\]$/ };
const placeholderPattern = /\b(TODO|TBD|lorem|PLACEHOLDER|FIXME)\b/i;
const forbiddenBundleText = ['Use only the supplied', 'Source: https://github.com', 'user confirmed', 'README conflicts', 'Do not add an unverified'];
const limits = {
  loopVideo: 1_572_864, // 1.5 MB, files named loop*.mp4
  video: 12_582_912, // 12 MB, every other .mp4
  jpgWebp: 409_600, // 400 KB
  png: 614_400, // 600 KB
  total: 94_371_840, // 90 MB, all of public/media
};
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
const isText = value => typeof value === 'string' && value.trim() !== '';
const asArray = value => (Array.isArray(value) ? value : []);
const size = bytes => `${bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`} (${bytes} bytes)`;
// Parse a JSON file; report (rather than throw on) a missing or malformed file.
function readJson(file, { optional = false } = {}) {
  if (!existsSync(file)) {
    if (!optional) fail(`${rel(file)} is missing.`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${rel(file)} is not valid JSON: ${error.message}`);
    return null;
  }
}
// Every string value in a JSON tree with its path, e.g. ['projects[0].card.src', './media/hive/card.jpg'].
function strings(value, path, out = []) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((item, index) => strings(item, `${path}[${index}]`, out));
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) strings(child, path ? `${path}.${key}` : key, out);
  return out;
}

// 1. Project order.
const data = readJson(join(root, 'src/data/projects.json')) || {};
const projects = asArray(data.projects);
if (!Array.isArray(data.projects)) fail('src/data/projects.json has no "projects" array.');
const order = projects.map(project => project?.id);
if (JSON.stringify(order) !== JSON.stringify(expectedOrder)) {
  fail(`Project order is [${order.join(', ')}]; expected [${expectedOrder.join(', ')}].`);
}
const ids = new Set(order);

// 2. Forbidden keys at any depth in project data.
function findKeys(value, path, forbidden, hits) {
  if (Array.isArray(value)) value.forEach((item, index) => findKeys(item, `${path}[${index}]`, forbidden, hits));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (forbidden.includes(key) && !allowedKeyParent[key]?.test(path)) hits.push(`${path}.${key}`);
      findKeys(child, `${path}.${key}`, forbidden, hits);
    }
  }
}
const keyHits = [];
findKeys(data.profile, 'profile', forbiddenKeys, keyHits);
findKeys(data.projects, 'projects', forbiddenKeys, keyHits);
if (keyHits.length) fail(`Forbidden keys found: ${keyHits.join(', ')}`);

// 3. Required fields and counts for every project.
projects.forEach((project, index) => {
  const at = `projects[${index}] (${project?.id || 'no id'})`;
  if (!project || typeof project !== 'object') return fail(`${at} is not an object.`);
  for (const field of requiredText) if (!isText(project[field])) fail(`${at}: "${field}" is missing or empty.`);
  const domains = asArray(project.domains);
  if (!domains.length || domains.some(domain => !allowedDomains.includes(domain))) {
    fail(`${at}: "domains" must be a non-empty subset of [${allowedDomains.join(', ')}]; got [${domains.join(', ')}].`);
  }
  const countCheck = (field, ok, rule) => { if (!ok(asArray(project[field]).length)) fail(`${at}: "${field}" must have ${rule}; has ${asArray(project[field]).length}.`); };
  countCheck('chips', n => n >= 2 && n <= 3, '2-3 entries');
  countCheck('tldr', n => n === 3, 'exactly 3 entries');
  countCheck('steps', n => n >= 3, 'at least 3 entries');
  countCheck('decisions', n => n >= 2, 'at least 2 entries');
  countCheck('results', n => n >= 2, 'at least 2 entries');
  asArray(project.results).forEach((result, resultIndex) => {
    if (!isText(result?.source)) fail(`${at}: results[${resultIndex}] ("${result?.label ?? ''}") has no "source".`);
  });
  if (!isText(project.card?.src)) fail(`${at}: "card.src" is missing or empty.`);
  if (!isText(project.hero?.src)) fail(`${at}: "hero.src" is missing or empty.`);
  // Every media object (card, hero, steps, failures, gallery): a valid type, non-empty alt text, and a poster on every video.
  const mediaAt = (media, path) => {
    if (!media || typeof media !== 'object') return fail(`${at}: ${path} is not a media object.`);
    if (!allowedMediaTypes.includes(media.type)) fail(`${at}: ${path} has type "${media.type ?? ''}"; expected one of [${allowedMediaTypes.join(', ')}].`);
    if (!isText(media.alt)) fail(`${at}: ${path} has no "alt" text.`);
    if (media.type === 'video' && !isText(media.poster)) fail(`${at}: ${path} is a video with no "poster".`);
  };
  mediaAt(project.card, 'card');
  mediaAt(project.hero, 'hero');
  asArray(project.steps).forEach((step, stepIndex) => { if (step?.media) mediaAt(step.media, `steps[${stepIndex}].media`); });
  asArray(project.failures).forEach((failure, failureIndex) => { if (failure?.media) mediaAt(failure.media, `failures[${failureIndex}].media`); });
  asArray(project.gallery).forEach((item, itemIndex) => mediaAt(item, `gallery[${itemIndex}]`));
  if (asArray(project.links).length + asArray(project.documents).length < 1) fail(`${at}: needs at least one entry in "links" or "documents".`);
});

// 4. Profile: the reel and skill chips must point at real projects.
const profile = data.profile;
if (!profile || typeof profile !== 'object') fail('src/data/projects.json has no "profile" object.');
else {
  const reel = asArray(profile.reel);
  if (reel.length !== 5) fail(`profile.reel must have exactly 5 entries; has ${reel.length}.`);
  reel.forEach((item, index) => {
    if (!ids.has(item?.project)) fail(`profile.reel[${index}].project "${item?.project}" is not a project id.`);
    if (!isText(item?.src)) fail(`profile.reel[${index}] has no "src".`);
    if (!isText(item?.poster)) fail(`profile.reel[${index}] is a video with no "poster".`);
    if (!isText(item?.caption)) fail(`profile.reel[${index}] has no "caption" (the reel's alt text).`);
  });
  asArray(profile.skills).forEach((group, groupIndex) => asArray(group?.items).forEach((item, itemIndex) => {
    asArray(item?.projects).forEach(id => {
      if (!ids.has(id)) fail(`profile.skills[${groupIndex}].items[${itemIndex}] ("${item?.name ?? ''}") references unknown project "${id}".`);
    });
  }));
}

// 5. Placeholder text in any project-data string value.
for (const [path, text] of strings(data, '')) {
  const match = text.match(placeholderPattern);
  if (match) fail(`projects.json ${path} contains placeholder text "${match[0]}".`);
}

// 6. Media: every "./media/..." string in projects.json and tradeStudies.json must exist, and every file must be used.
const references = new Map(); // './media/x' -> [json paths that use it]
const studies = readJson(join(root, 'src/data/tradeStudies.json'), { optional: true });
// Document buttons of the form #/study/<id> must point at a study that exists.
projects.forEach((project, index) => asArray(project?.documents).forEach((doc, docIndex) => {
  const match = /^#\/study\/(.+)$/.exec(doc?.href ?? '');
  if (match && !(studies && Object.hasOwn(studies, match[1]))) fail(`projects[${index}] (${project.id}): documents[${docIndex}] links to "${doc.href}" but tradeStudies.json has no study "${match[1]}".`);
}));
for (const [file, tree] of [['projects.json', data], ['tradeStudies.json', studies]]) {
  for (const [path, text] of strings(tree, '')) {
    if (text.startsWith('./media/')) references.set(text, [...(references.get(text) || []), `${file} ${path}`]);
  }
}
for (const [path, uses] of references) {
  if (!existsSync(join(root, 'public', path.slice(2)))) {
    fail(`${path} is missing from public/ (used by ${uses[0]}${uses.length > 1 ? ` and ${uses.length - 1} more` : ''}).`);
  }
}
const mediaDir = join(root, 'public/media');
const mediaFiles = walk(mediaDir);
const mediaNames = mediaFiles.map(file => relative(mediaDir, file).split('\\').join('/'));
const referencedNames = new Set([...references.keys()].map(path => path.slice('./media/'.length)));
for (const name of mediaNames) {
  if (!referencedNames.has(name)) fail(`public/media/${name} is not referenced by projects.json or tradeStudies.json (orphan).`);
}

// 7. Every video has a same-name .jpg poster.
for (const name of mediaNames.filter(name => /\.mp4$/i.test(name))) {
  const poster = name.replace(/\.mp4$/i, '.jpg');
  if (!mediaNames.includes(poster)) fail(`public/media/${name} has no poster: expected public/media/${poster}.`);
}

// 8. Size budgets.
let totalBytes = 0;
for (const file of mediaFiles) {
  const name = rel(file);
  const bytes = statSync(file).size;
  totalBytes += bytes;
  const check = (limit, kind) => { if (bytes > limit) fail(`${name} is ${size(bytes)}, over the ${size(limit)} ${kind} budget.`); };
  if (/\.mp4$/i.test(file)) {
    if (/^loop.*\.mp4$/i.test(basename(file))) check(limits.loopVideo, 'loop-clip');
    else check(limits.video, 'video');
  } else if (/\.(jpe?g|webp)$/i.test(file)) check(limits.jpgWebp, 'JPG/WebP');
  else if (/\.png$/i.test(file)) check(limits.png, 'PNG');
}
if (totalBytes > limits.total) fail(`public/media totals ${size(totalBytes)}, over the ${size(limits.total)} total budget.`);

// 9. Built JavaScript: forbidden text.
let bundles = [];
if (!skipDist) {
  if (!existsSync(dist) || !statSync(dist).isDirectory()) {
    fail(`Build output not found at ${dist}. Run \`npm run build\` first (or set VERIFY_DIST, or VERIFY_SKIP_DIST=1).`);
  } else {
    bundles = walk(join(dist, 'assets'), file => file.endsWith('.js'));
    if (!bundles.length) fail(`No JavaScript bundles found in ${join(dist, 'assets')}.`);
    for (const file of bundles) {
      const text = readFileSync(file, 'utf8');
      const name = relative(dist, file).split('\\').join('/');
      for (const phrase of forbiddenBundleText) {
        if (text.includes(phrase)) fail(`${name} contains forbidden text: "${phrase}".`);
      }
    }
  }
}

if (errors.length) {
  console.error(`verify FAILED (${errors.length} problem${errors.length === 1 ? '' : 's'}):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`verify OK: ${order.length} projects in order, ${references.size} media references resolved, ${mediaNames.length} media files all referenced (${(totalBytes / 1_048_576).toFixed(1)} MB), ${skipDist ? 'bundle checks skipped' : `${bundles.length} bundle(s) clean`}.`);

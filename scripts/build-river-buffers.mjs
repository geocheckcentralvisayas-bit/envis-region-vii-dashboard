import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MAPSHAPER = path.join(ROOT, 'node_modules', 'mapshaper', 'bin', 'mapshaper');

const RIVERS = path.join(ROOT, 'public', 'data', 'geojson', 'river_networks.geojson');
// Combined Land Cover 2025 (Cebu + Bohol), dissolved by LCM_CLASS. Generated as spatial-src/_lc_2025_cebu_bohol.geojson.
const LAND = path.join(ROOT, 'spatial-src', '_lc_2025_cebu_bohol.geojson');
const OUT = path.join(ROOT, 'spatial-src', 'river_networks_buffered_lc2025.geojson');
const TMP = path.join(ROOT, 'spatial-src', '_tmp_buffers');

function run(args, label) {
  try {
    execFileSync(process.execPath, [MAPSHAPER, ...args], { cwd: ROOT, stdio: 'pipe', maxBuffer: 1024 * 1024 * 200 });
  } catch (error) {
    const msg = String(error.stderr || error.stdout || error.message).slice(0, 1200);
    throw new Error(`${label} failed: ${msg}`);
  }
}

const GROUPS = [
  { name: 'urban', meters: 3, filter: "LCM_CLASS=='Built-up'" },
  { name: 'agricultural', meters: 20, filter: "LCM_CLASS=='Annual Crop' || LCM_CLASS=='Perennial Crop'" },
  { name: 'forest', meters: 40, filter: "LCM_CLASS=='Open Forest' || LCM_CLASS=='Closed Forest' || LCM_CLASS=='Mangrove Forest'" },
];

if (!existsSync(RIVERS)) throw new Error(`Missing ${RIVERS} (run data:spatial/build first)`);
if (!existsSync(LAND)) throw new Error(`Missing ${LAND}`);

mkdirSync(TMP, { recursive: true });

const parts = [];
for (const group of GROUPS) {
  const part = path.join(TMP, `${group.name}.json`);
  console.log(`  • ${group.name} buffer ${group.meters}m …`);
  run([
    '-i', RIVERS, 'name=rivers',
    '-proj', 'EPSG:32651', 'target=rivers',
    '-i', LAND, 'name=lc',
    '-proj', 'EPSG:32651', 'target=lc',
    '-filter', group.filter, 'target=lc',
    '-clip', 'source=lc', 'target=rivers',
    '-buffer', String(group.meters), 'units=meters', 'target=rivers',
    '-each', `buffer_m=${group.meters}; zone='${group.name}'`, 'target=rivers',
    '-proj', 'wgs84', 'target=rivers',
    '-o', part, 'target=rivers', 'format=geojson',
  ], group.name);
  parts.push(part);
  console.log(`    wrote ${part}`);
}

// Merge and dissolve by zone so the overlay keeps 3m/20m/40m classes
console.log('  • merging buffers …');
run([
  ...parts, 'combine-files',
  '-merge-layers', 'force',
  '-dissolve', 'zone', 'copy-fields=buffer_m',
  '-o', OUT, 'format=geojson',
], 'merge');

console.log(`\nBuffered river network layer written: ${OUT}`);
console.log('Urban=3m (Built-up), Agricultural=20m (Annual/Perennial Crop), Forest=40m (Open/Closed/Mangrove Forest).');
console.log('Reference: Land Cover 2025 (Cebu & Bohol, dissolved by LCM_CLASS). Other land cover classes: no buffer applied.');

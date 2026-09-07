import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const context = { window: {} };
runInNewContext(await readFile(new URL('./src/content.js', import.meta.url), 'utf8'), context);
const regions = context.window.ATLAS_DATA.regions;
const required = ['name', 'description', 'chapter', 'type', 'accent', 'faction', 'firstRecord', 'position'];
const models = new Set();
for (const [id, region] of Object.entries(regions)) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid region id: ${id}`);
  for (const field of required) if (typeof region[field] !== 'string' || !region[field].trim()) throw new Error(`${id}: missing ${field}`);
  if (!region.view?.target || !region.view?.orbit) throw new Error(`${id}: missing camera view`);
  if (!region.model || models.has(region.model) || region.model.includes('demo-world.glb')) throw new Error(`${id}: region must have its own model`);
  models.add(region.model);
  const ids = new Set();
  if (!Array.isArray(region.characters)) throw new Error(`${id}: characters must be an array`);
  for (const character of region.characters) {
    if (!/^[a-z0-9-]+$/.test(character.id) || ids.has(character.id)) throw new Error(`${id}: invalid or duplicate character id`);
    ids.add(character.id);
    for (const field of ['name', 'role', 'description', 'firstRecord']) if (!character[field]) throw new Error(`${character.id}: missing ${field}`);
    if (character.model !== null) models.add(character.model);
  }
}
for (const model of models) {
  if (typeof model !== 'string' || !/^\.\/assets\/[a-zA-Z0-9_/-]+\.glb$/.test(model) || model.includes('..', 2)) throw new Error(`Use a local GLB path or null: ${model}`);
  await access(new URL(`./src/${model}`, import.meta.url));
  const bytes = await readFile(new URL(`./src/${model}`, import.meta.url));
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`Invalid GLB: ${model}`);
}
console.log(`Validated ${Object.keys(regions).length} regions and ${models.size} model files.`);

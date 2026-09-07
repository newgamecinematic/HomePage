import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const context = { window: {} };
runInNewContext(await readFile(new URL('./src/content.js', import.meta.url), 'utf8'), context);
const { worlds, regions, defaultWorld } = context.window.ATLAS_DATA;
const required = ['name', 'description', 'chapter', 'type', 'accent', 'faction', 'firstRecord', 'position'];
const models = new Set();
if (!Object.hasOwn(worlds, defaultWorld)) throw new Error('defaultWorld must reference a world');
const assignedRegions = new Set();
for (const [id, world] of Object.entries(worlds)) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid world id: ${id}`);
  for (const field of ['name', 'kicker', 'archiveDescription', 'titleLine', 'titleEmphasis', 'description', 'era', 'accent', 'model', 'poster']) {
    if (typeof world[field] !== 'string' || !world[field].trim()) throw new Error(`${id}: missing ${field}`);
  }
  if (!Array.isArray(world.regions) || !world.regions.length) throw new Error(`${id}: regions must be a non-empty array`);
  if (new Set(world.regions).size !== world.regions.length) throw new Error(`${id}: duplicate region reference`);
  for (const regionId of world.regions) {
    if (!Object.hasOwn(regions, regionId)) throw new Error(`${id}: unknown region ${regionId}`);
    assignedRegions.add(regionId);
  }
  models.add(world.model);
  if (!/^\.\/assets\/[a-zA-Z0-9_/-]+\.png$/.test(world.poster) || world.poster.includes('..', 2)) throw new Error(`${id}: use a local PNG poster`);
  await access(new URL(`./src/${world.poster}`, import.meta.url));
}
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
for (const id of Object.keys(regions)) if (!assignedRegions.has(id)) throw new Error(`${id}: region is not assigned to a world`);
for (const model of models) {
  if (typeof model !== 'string' || !/^\.\/assets\/[a-zA-Z0-9_/-]+\.glb$/.test(model) || model.includes('..', 2)) throw new Error(`Use a local GLB path or null: ${model}`);
  await access(new URL(`./src/${model}`, import.meta.url));
  const bytes = await readFile(new URL(`./src/${model}`, import.meta.url));
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error(`Invalid GLB: ${model}`);
}
console.log(`Validated ${Object.keys(worlds).length} worlds, ${Object.keys(regions).length} regions, and ${models.size} model files.`);
